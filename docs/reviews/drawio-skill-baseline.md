# Draw.io Skill Baseline

## Scenario

The agent inspected the current MOD-02 Draw.io and SVG pair without the
`creating-drawio-architecture-diagrams` skill.

The no-skill control received only this scenario and the two raw artifact
paths:

> Inspect these raw architecture-diagram artifacts and propose a concrete
> revision:
>
> - `diagrams/mod-02-c4-context-container.drawio`
> - `static/img/diagrams/mod-02-c4-context-container.svg`
>
> The revision must preserve the diagram semantics and the paired
> source/published files. Return the layout rules you would apply and identify
> any visual defects visible from the SVG geometry.

## Observed response

The response judged the pair semantically aligned but geometrically
inconsistent. It reported these concrete geometry findings:

- The Draw.io internal boundary ends at `y=665`, while the payment worker
  occupies `y=620..692`, leaving the worker outside the declared system
  boundary.
- The SVG extends that boundary to `y=704`, but the worker still extends to
  `y=706`.
- The SVG changes panel positions and sizes, corner radii, note text, and
  container type labels relative to the Draw.io source.

It proposed the following layout rules:

- Keep both panels on a shared `60px` horizontal margin and align title and
  note insets.
- Keep the context row ordered employee → system → bank, with orthogonal
  horizontal connectors.
- Make the system boundary fully wrap the system node and the downward
  “expand target system” connector.
- Keep the employee and bank external to the container boundary, and place
  Web, API, database, and worker nodes inside that boundary with clear
  padding.
- Move the worker upward or extend the internal boundary until it is fully
  enclosed.
- Center relation labels on connectors with opaque backgrounds and preserve
  arrow direction.
- Make SVG coordinates, text, styles, and labels match the Draw.io source
  exactly, or revise both files together.

The response supplied exact coordinates for the boundary-containment defect
and a `60px` panel margin, but it did not quantify the requested “clear
padding” or any connector-to-label or text-to-node clearance.

## Missed requirements

1. **Opaque edge-label backgrounds interrupt connector strokes.** Missed. The
   response did not diagnose the opaque label shapes as a defect; it
   explicitly recommended keeping opaque backgrounds. It supplied no
   operational rule for a connector-free label lane or numeric clearance
   around labels.
2. **Lower node title/type baselines are crowded.** Missed. The response did
   not identify the lower title/type baselines as crowded and supplied no
   minimum text-to-text or text-to-node-edge clearance.
3. **The existing automated test proves file pairing but not visual
   clearance.** Missed. The response did not inspect or discuss the test
   boundary, so it did not separate deterministic source/published pairing
   checks from visual geometry checks.
4. **Desktop and mobile screenshot QA is necessary.** Missed. The response
   proposed no browser-rendered desktop or mobile screenshot review.

Independently of the response, the current SVG is the failing baseline. Its
opaque relation-label paths cover the connectors they sit on—for example, the
`提交费用` label path spans `x=333..431` across the connector at `y=219`, and
the `请求付款` label path spans `x=765..859` across the same connector
baseline—visually erasing those connector segments. In the lower nodes, title
and type baselines are crowded: the payment worker and bank titles are at
`y=660`, their type baselines are at `y=690`, and their node bottoms are at
`y=706`, leaving only `16px` from the type baseline to the node edge.

The current `tests/drawio-svg-pilot.test.mjs` passes while checking that the
paired files exist, retain expected labels, use the expected SVG view box, and
are embedded responsively. It contains no assertion for connector-label
clearance or lower text clearance. This passing test therefore does not
invalidate the visual RED result.

## Skill requirements derived from the failure

- Reserve a connector-free label lane and define numeric clearance.
- Size nodes from text before routing edges.
- Separate deterministic file checks from browser visual QA.

## Forward-test result

The GREEN test used a fresh-context agent with read-only access to the new
skill and the two raw artifacts. It received only:

> Use `$creating-drawio-architecture-diagrams` at
> `.codex/skills/creating-drawio-architecture-diagrams` to propose a concrete
> revision of:
>
> - `diagrams/mod-02-c4-context-container.drawio`
> - `static/img/diagrams/mod-02-c4-context-container.svg`
>
> Preserve semantics and paired files. Return the layout rules, validation
> steps, and visual defects identified from the SVG geometry.

The final forward test explicitly covered all four baseline misses:

1. It diagnosed every main opaque relation-label background as erasing its
   connector, measured label/node overlaps, and proposed connector-free lanes.
2. It reported the lower title/type baseline and bottom-clearance geometry,
   including the database's `21px` baseline separation and approximately
   `12px` visible bottom clearance.
3. It ran the deterministic validator successfully, quoted
   `Validated mod-02-c4-context-container`, and stated that this proves
   pair/accessibility/declared-label checks rather than rendered geometry.
4. It required real-browser review at desktop `1440x1000` and mobile
   `390x844`, with connector continuity, containment, text readability,
   cropping, dimensions, HTTP, console, and overflow checks.

It also returned every numeric layout threshold without receiving those values
in the test prompt: node padding of `16px` horizontal and `14px` vertical;
`22px` title/type baseline separation; `14px` text-to-bottom clearance; and
edge-label clearances of `8px` from strokes, `16px` from arrows, and `12px`
from nodes. It preserved the Context-to-Container semantics and identified
source/published drift in notes, role labels, panels, boundaries, and nodes.

Two minimal wording refinements were made during GREEN. The completion contract
now requires reporting every numeric layout threshold after an initial probe
omitted the node/text values. The workflow now requires measured lower-node
baselines and bottom clearance after a second probe listed the thresholds but
did not explicitly report the current lower-node crowding. A fresh final probe
then satisfied the complete contract.
