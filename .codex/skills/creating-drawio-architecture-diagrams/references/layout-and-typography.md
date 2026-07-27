# Layout and Typography

## Geometry contract

- Node padding: 16 px horizontal, 14 px vertical minimum.
- Title/type baseline separation: 22 px minimum.
- Text-to-bottom clearance: 14 px minimum.
- Edge-label-to-stroke clearance: 8 px minimum.
- Edge-label-to-arrow clearance: 16 px minimum.
- Edge-label-to-node clearance: 12 px minimum.
- Node title: one line preferred, two lines maximum.
- Edge label: short verb or verb-object phrase; omit on short edges.
- Opaque label backgrounds may not erase connector strokes.

Measure clearance from the visible text or label boundary, not from an oversized
invisible selection box. Keep body text at least 15 px and type/role labels at
least 10 px. Move long explanations into the article, caption, or a separate
note instead of shrinking node text.

## Layout sequence

Use this order:

1. Inventory semantics: nodes, boundaries, relationship direction, labels, and
   facts the diagram must not imply.
2. Choose one primary reading direction.
3. Size text, then nodes, using the padding and baseline rules above.
4. Reserve label lanes with clearance from strokes, arrows, and nodes.
5. Route edges through explicit ports, preferring simple orthogonal paths.
6. Export the synchronized SVG.
7. Inspect the actual rendered article at desktop and mobile widths.

Do not use color as the only distinction between internal, external, container,
or relationship roles. Preserve connector continuity and arrow direction.
