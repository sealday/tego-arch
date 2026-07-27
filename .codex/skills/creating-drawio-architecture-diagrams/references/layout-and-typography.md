# Layout and Typography

## Geometry contract

Every threshold in this reference is a **final rendered CSS-pixel** threshold,
not an SVG user-unit or Draw.io authoring-unit threshold. Compute the scale as
`rendered SVG width / viewBox width`, multiply authoring geometry by that scale,
and record the result. For the MOD-02 exemplar, `800 / 1200 = 2/3`, so a
15 CSS px font requires at least 22.5 authoring units and a 22 CSS px baseline
gap requires at least 33 authoring units.

- Node padding: 16 CSS px horizontal, 14 CSS px vertical minimum.
- Title/type baseline separation: 22 CSS px minimum.
- Text-to-bottom clearance: 14 CSS px minimum.
- Edge-label-to-stroke clearance: 8 CSS px minimum.
- Edge-label-to-arrow clearance: 16 CSS px minimum.
- Edge-label-to-node clearance: 12 CSS px minimum.
- Node title: one line preferred, two lines maximum.
- Edge label: short verb or verb-object phrase; omit on short edges.
- Opaque label backgrounds may not erase connector strokes.

Measure clearance from the visible text or label boundary, not from an oversized
invisible selection box. Keep body and edge text at least 15 rendered CSS px and
type/role labels at least 10 rendered CSS px. Move long explanations into the
article, caption, or a separate note instead of shrinking node text.

## Layout sequence

Use this order:

1. Inventory semantics: nodes, boundaries, relationship direction, labels, and
   facts the diagram must not imply.
2. Choose one primary reading direction.
3. Resolve the intended rendered width, calculate the authoring-to-rendered
   scale, then size text and nodes using the rendered padding and baseline rules
   above.
4. Reserve label lanes with clearance from strokes, arrows, and nodes.
5. Route edges through explicit ports, preferring simple orthogonal paths.
6. Export the synchronized SVG.
7. Inspect the actual rendered article at desktop and mobile widths, recording
   final rendered text sizes, baselines, and visible clearances rather than only
   the image's outer dimensions.

Do not use color as the only distinction between internal, external, container,
or relationship roles. Preserve connector continuity and arrow direction.
