---
name: creating-drawio-architecture-diagrams
description: Use when creating, revising, exporting, or integrating Draw.io or diagrams.net architecture diagrams for Tego Arch articles, especially paired .drawio and SVG assets with connector-label collisions, text overflow, unclear routing, or responsive readability concerns.
---

# Creating Draw.io Architecture Diagrams

## Core principle

Readable topology outranks decoration. Preserve the architectural meaning first; use layout, typography, color, and routing to make that meaning easier to read.

## Required workflow

1. For every create or revise task, read [references/layout-and-typography.md](references/layout-and-typography.md) before proposing geometry.
2. Inventory the current nodes, boundaries, relationships, labels, reading direction, and claims that the article does not make.
3. Before saving or embedding, read [references/repository-integration.md](references/repository-integration.md).
4. Keep the editable Draw.io source and published SVG semantically synchronized: the same slug, nodes, boundaries, relationships, direction, and wording. Update both when any semantic element changes.
5. Run the bundled validator. Treat it as deterministic pair/accessibility validation, not proof of visual clearance.
6. For existing diagrams, report lower-node title/type baseline coordinates and
   text-to-bottom clearance; passing a numeric minimum does not replace rendered
   legibility judgment.
7. Render the affected article in a real browser and inspect both desktop and mobile views. Check label lanes, text clearance, connector continuity, containment, cropping, overflow, and legibility.

## Completion contract

Return:

- source, published SVG, and article paths;
- assumptions and semantics deliberately preserved;
- layout rules applied, including every numeric node, text, stroke, arrow, and
  node-clearance threshold from the required layout reference;
- validator command and complete output;
- desktop and mobile viewport sizes plus a PASS/FAIL visual verdict and observed defects.

## Common mistakes

| Mistake | Required correction |
| --- | --- |
| Opaque label background erases a connector | Reserve a connector-free label lane and apply the reference clearances. |
| Lower title/type baselines or bottom text look crowded | Measure and report the baselines and bottom clearance; size text and node before routing. |
| Draw.io and SVG merely coexist but geometrically or semantically drift | Revise and compare the pair together. |
| Passing file tests are treated as visual proof | State what the validator covers, then perform real desktop/mobile browser QA. |
