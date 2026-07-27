# Repository Integration

## Paired paths

For a shared `<slug>`, save:

```text
diagrams/<slug>.drawio
static/img/diagrams/<slug>.svg
```

Resolve these task inputs before validation:

```text
<article-path>
<article-route>
<required-label>...       # every semantic label required in both files
<measured-node>...        # every node whose geometry needs measurement
```

Do not reuse another article's route, labels, or measured-node list.

### Worked example: MOD-02

```text
diagrams/mod-02-c4-context-container.drawio
static/img/diagrams/mod-02-c4-context-container.svg
content/modeling/mod-02-c4-context-container.mdx
/modeling/mod-02
```

The Draw.io source and SVG must share the slug and remain semantically
synchronized. Use plain-text `mxCell.value` labels. Give the SVG a `viewBox`,
no fixed root `width` or `height`, and accessible `<title>`, `<desc>`,
`role="img"`, and `aria-labelledby`.

## MDX embedding

Articles embed the published SVG by its `/img/diagrams/` public path, never the
Draw.io source. Keep the image inside the responsive horizontal-scroll wrapper:

```mdx
<div className="architecture-diagram-scroll">

![<concise purpose-oriented alt text>](/img/diagrams/<slug>.svg)

</div>
```

The wrapper is required because its image remains 50rem wide and scrolls
horizontally on narrow screens instead of being compressed until labels become
unreadable.

## Deterministic validation

Run the bundled validator from the repository root:

```bash
node .codex/skills/creating-drawio-architecture-diagrams/scripts/validate_drawio_svg.mjs \
  diagrams/<slug>.drawio \
  static/img/diagrams/<slug>.svg \
  --label "<required label>"
```

Repeat `--label` for every semantic label that must occur in both files. Also
run the repository contract relevant to the affected article. For the MOD-02
worked example:

```bash
node --test tests/drawio-svg-pilot.test.mjs tests/drawio-diagram-validator.test.mjs
```

These checks prove pairing, XML shape, responsive embedding, accessibility
metadata, and declared label presence. They do not prove rendered text or
connector clearance.

## Desktop and mobile browser QA

Build and serve the production site:

```bash
npm run build
npm run serve -- --host 127.0.0.1 --port 3100
```

In a real browser, open the parameterized route:

```text
http://127.0.0.1:3100/tego-arch<article-route>
```

Capture and inspect the page at desktop `1440x1000` and mobile `390x844`. Query
the affected SVG image and its `.architecture-diagram-scroll` wrapper.

At desktop, record the rendered SVG width from
`image.getBoundingClientRect().width` and require exactly `800px`; the `50rem`
CSS declaration or viewport size alone is not evidence.

At mobile, record:

```text
wrapper.scrollWidth > wrapper.clientWidth
document.documentElement.scrollWidth === document.documentElement.clientWidth
```

The first assertion proves horizontal overflow stays local and scrollable; the
second proves the document itself does not overflow. At both viewports also
verify HTTP 200, no console errors, non-zero SVG dimensions, every
`<required-label>` visible, readable text, uninterrupted connectors, clear
boundaries, and no cropping. Measure baseline and edge clearance for every
`<measured-node>`.

For artifact-changing work, perform these checks and record the actual values
with separate desktop/mobile `PASS` or `FAIL` verdicts. For proposal-only or
read-only work, do not imply rendering occurred: report browser QA as
`NOT RUN`, then list `<article-route>`, both viewports, the exact `800px`
desktop assertion, both mobile scroll/overflow assertions, and the remaining
planned checks above.
