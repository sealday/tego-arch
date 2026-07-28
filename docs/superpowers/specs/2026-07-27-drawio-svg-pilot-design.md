# Draw.io + SVG Pilot Design

## Goal

Replace the Mermaid diagram in `content/modeling/mod-02-c4-context-container.mdx`
with one deliberately styled Draw.io diagram, while keeping an editable source
file and a browser-renderable SVG file. The pilot exists to evaluate visual
quality and maintenance shape locally; it does not migrate other diagrams or
remove the site-wide Mermaid integration.

## Selected document

Use `MOD-02 C4 Context 与 Container` because its diagram is large enough to
exercise hierarchy, boundaries, relationships, and Chinese labels, but small
enough to review as a single visual experiment. The page has no existing raster
illustration, so the result can be compared directly with the current Mermaid
rendering.

Preserve the page's front matter, headings, prose, links, source claims, and
diagram topology. Only the diagram representation and the minimum surrounding
copy needed to introduce the new visual are in scope.

## Assets and page integration

- Editable source:
  `diagrams/mod-02-c4-context-container.drawio`
- Published asset:
  `static/img/diagrams/mod-02-c4-context-container.svg`
- MDX reference:
  `/img/diagrams/mod-02-c4-context-container.svg`

The `.drawio` file is the editable authority. The SVG is the reviewed web
artifact. Both files are committed so local preview and GitHub Pages builds do
not depend on a Draw.io installation or external rendering service.

## Visual language

Use the site's warm-paper palette rather than Draw.io's default blue boxes:

- warm off-white canvas and group surfaces;
- dark ink for text and primary connectors;
- muted navy for the Context-level boundary and primary system;
- brick red only for the Container-level zoom marker and boundary emphasis;
- muted green for owned application containers;
- neutral grey for external actors and dependencies.

The diagram reads left to right. The upper band establishes the Context view:
user, system, and external system. A clear zoom transition leads to the lower
Container view: web application, API application, and database. Short labels
stay inside shapes; explanatory detail remains in the article.

The SVG must have a responsive `viewBox`, no fixed minimum width, a transparent
or warm-paper-compatible background, and readable Chinese text at both desktop
and mobile widths. The Markdown image supplies purpose-oriented alternative
text. The surrounding prose states what relationship to inspect and what the
diagram does not prove.

## Test-first contract

Before adding assets or changing MDX, add a focused test that requires:

1. the selected page to contain no Mermaid fence;
2. the selected page to reference the exact SVG path;
3. both `.drawio` and `.svg` assets to exist;
4. the Draw.io source to contain an `mxfile` diagram;
5. the SVG to contain an `<svg>` root, a `viewBox`, and the expected Context and
   Container labels.

Run the focused test before implementation and confirm it fails because the
pilot assets and MDX reference do not yet exist. After implementation, rerun the
focused test, the repository test suite, content validation, type checking, and
the Docusaurus production build.

## Local preview acceptance

Start the built site or Docusaurus development server from the isolated
worktree. Inspect `/modeling/mod-02` at desktop and narrow mobile
widths. Accept the pilot only when:

- the SVG loads without console errors;
- the page has no horizontal document overflow;
- labels and connectors remain legible;
- Context and Container levels are visually distinct;
- the diagram fits the article's existing visual language;
- the editable `.drawio` source remains paired with the rendered SVG.

## Out of scope

- migrating the other 36 Mermaid diagrams;
- removing `@docusaurus/theme-mermaid`;
- changing site-wide visual-density weights or article contracts;
- adding a Draw.io runtime viewer or external rendering service;
- automating Draw.io-to-SVG export before the pilot is visually approved.
