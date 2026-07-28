---
name: illustrating-architecture-articles
description: Use when deciding, creating, revising, or integrating visual explanations for Tego Arch articles, especially architecture diagrams, flows, state maps, comparison boards, and visual summaries.
---

# Illustrating Architecture Articles

## Core principle

Choose the smallest visual form that makes an architectural judgment easier to understand. Do not draw when prose or a compact table is clearer. Exact topology favors deterministic diagrams; conceptual orientation may use an original raster illustration.

## Format decision gate

Record one result before producing an asset: `无需图`, `Mermaid`, `Draw.io + SVG`, or `位图`.

Choose **无需图** when the visual would only repeat nearby prose, a short list, or a two-dimensional comparison table.

Choose **Mermaid** when most of these are true:

- the diagram has roughly 3–6 nodes with short labels;
- it primarily expresses sequence, state, or a simple flow;
- it changes frequently with code or documentation;
- text diff, script generation, and low editing cost matter more than exact placement;
- the first natural layout is already readable without invisible nodes or layout hacks.

Choose **Draw.io + SVG** when any two of these are true:

1. more than 7 primary nodes;
2. two or more system boundaries, containers, or visual regions;
3. labels wrap or exceed roughly 12 Chinese characters;
4. connectors cross or require deliberate routing;
5. connectors carry explanatory labels;
6. size, position, or color communicates hierarchy;
7. the diagram is a core teaching or publication asset;
8. Mermaid requires layout hacks to remain readable.

Choose **位图** for a conceptual summary, comparison board, or memorable orientation image whose value comes from visual metaphor rather than exact topology. Use the warm hand-drawn language in `references/visual-language.md`; never imitate a named artist or copy a source composition.

Do not bulk-replace existing Mermaid diagrams. Reassess a diagram when it is new, actively changing, visually unclear, or already dependent on layout hacks.

## Required routing

- For Mermaid, keep exact labels and relationships in the MDX fence and render-check the affected page.
- For Draw.io + SVG, **REQUIRED SUB-SKILL:** use `creating-drawio-architecture-diagrams`.
- For 位图 generation or editing, **REQUIRED SUB-SKILL:** use `imagegen`, then read `references/visual-language.md`, `references/prompt-contract.md`, and `references/repository-integration.md`.

## Workflow

1. Extract the claim, mechanism, control owner, states, failure branch, recovery action, and boundary. Illustrate only supported content.
2. Apply the format decision gate and record the choice plus the decisive criteria.
3. Select one visual job:
   - overview flow for control and handoffs;
   - state/recovery map for transitions and loops;
   - comparison board for 3+ comparable dimensions;
   - layered model for hierarchy or responsibility;
   - visual summary for one decisive conclusion.
4. Follow the selected format's required routing. Keep exact details in prose, deterministic diagrams, tables, or captions rather than forcing them into a raster image.
5. Inspect the result at article width. Verify text, topology, arrows, labels, color-independent meaning, and responsive readability.
6. Save editable sources where applicable, integrate the published asset, run focused content validation, and render the affected page at desktop and mobile widths.

## Output contract

Return:

- the format decision and decisive criteria;
- the final source/published paths and MDX insertion, or the reason for `无需图`;
- the prompt and reference-image roles when 位图 was selected;
- a visual QA result covering text, topology, factual scope, responsive readability, and forbidden marks;
- the source-ledger entry or explicit registration gap;
- the validation commands and results.

## Common mistakes

| Failure | Correction |
| --- | --- |
| Every diagram defaults to one tool | Apply the format decision gate before editing or generating. |
| Replacing readable Mermaid in bulk | Migrate only new, changing, unclear, or layout-hacked diagrams. |
| Keeping a complex publication diagram in Mermaid | Move to Draw.io + SVG when two decision signals apply. |
| Using Draw.io for a tiny changing flow | Prefer Mermaid when diffability and change cost dominate. |
| Copying a sample's mascot, signature, or exact layout | Rebuild from article semantics with project-generic icons and a new composition. |
| Asking the model to typeset a paragraph | Use short closed-label vocabulary; move detail back to the article. |
| Decorative image that teaches nothing | Name the single judgment the reader should retain, or omit the image. |
| A raster image replaces exact architecture evidence | Pair it with precise prose, Mermaid, Draw.io + SVG, a table, or an evidence card. |
| Asset exists only in the generator output directory | Copy it into `static/img/illustrations/` and register it before completion. |
| Writer records a visual choice but produces nothing | Do not mark the article complete until the selected asset exists and the rendered page is checked. |
