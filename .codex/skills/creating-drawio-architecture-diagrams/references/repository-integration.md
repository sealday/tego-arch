# Repository Integration

## Paired paths

For a shared `<slug>`, save:

```text
diagrams/<slug>.drawio
static/img/diagrams/<slug>.svg
```

For MOD-02 the exact pair and article are:

```text
diagrams/mod-02-c4-context-container.drawio
static/img/diagrams/mod-02-c4-context-container.svg
content/modeling/mod-02-c4-context-container.mdx
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
run the focused repository contract:

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

In a real browser, open:

```text
http://127.0.0.1:3100/tego-arch/modeling/mod-02
```

Capture and inspect the page at desktop `1440x1000` and mobile `390x844`.
For each viewport, verify HTTP 200, no console errors,
`document.scrollWidth === document.clientWidth`, non-zero SVG dimensions,
visible Context and Container labels, readable text, uninterrupted connectors,
clear boundaries, and no cropping. Record a separate PASS/FAIL verdict for
each viewport; screenshots are evidence, not a substitute for inspection.
