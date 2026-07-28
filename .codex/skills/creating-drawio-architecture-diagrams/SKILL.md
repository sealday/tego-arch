---
name: creating-drawio-architecture-diagrams
description: Use when creating, revising, exporting, or integrating Draw.io or diagrams.net architecture diagrams for Tego Arch articles, especially paired .drawio and SVG assets with connector-label collisions, text overflow, unclear routing, or responsive readability concerns.
---

# Creating Draw.io Architecture Diagrams

## Core principle

Readable topology outranks decoration. Preserve the architectural meaning first; use layout, typography, color, and routing to make that meaning easier to read.

## Required workflow

1. For every create or revise task, read [references/layout-and-typography.md](references/layout-and-typography.md) before proposing geometry.
2. Inventory the current nodes, boundaries, relationships, labels, reading direction, and claims that the article does not make. Define the affected article route, semantic labels required in both files, and every node whose geometry must be measured.
3. Before saving or embedding, read [references/repository-integration.md](references/repository-integration.md).
4. Keep the editable Draw.io source and published SVG semantically synchronized: the same slug, nodes, boundaries, relationships, direction, and wording. Update both when any semantic element changes.
5. Run the bundled validator. Treat it as deterministic pair/accessibility validation, not proof of visual clearance.
6. For existing diagrams, report title/type baseline coordinates and
   text-to-edge clearance for every node identified for geometry measurement,
   in final rendered CSS pixels rather than SVG authoring units; passing a
   numeric minimum does not replace rendered legibility judgment.
7. For artifact-changing work, render the affected article in a real browser
   and record measured desktop/mobile PASS/FAIL evidence. For proposal-only or
   read-only work, report browser QA as `NOT RUN` and list the exact route,
   viewports, measurements, and checks that the changing run must perform.

## Completion contract

Return:

- source, published SVG, and article paths;
- assumptions and semantics deliberately preserved;
- layout rules applied, including every numeric node, text, stroke, arrow, and
  node-clearance threshold from the required layout reference, expressed in
  final rendered CSS pixels with the authoring-to-rendered scale recorded;
- validator command and complete output;
- browser QA status: measured `PASS`/`FAIL` for artifact-changing work or
  `NOT RUN` for proposal-only/read-only work;
- desktop `1440x1000` rendered SVG width: measured exactly `800px`, or the
  planned exact `800px` assertion when status is `NOT RUN`;
- mobile `390x844` measurements proving diagram-wrapper local horizontal scroll
  and no document-level overflow, or those exact planned assertions when status
  is `NOT RUN`;
- observed defects and the parameterized article route, required labels, and
  measured nodes used for validation.

## Common mistakes

| Mistake | Required correction |
| --- | --- |
| Opaque label background erases a connector | Reserve a connector-free label lane and apply the reference clearances. |
| A node's title/type baselines or edge clearance look crowded | Measure that named node's baselines and edge clearance; size text and node before routing. |
| Draw.io and SVG merely coexist but geometrically or semantically drift | Revise and compare the pair together. |
| Planned browser QA is presented as completed | Use `NOT RUN` for read-only work; only artifact-changing runs may report measured PASS/FAIL. |
