# Patterns Task 2 Report — AGT-P-01 Workflow vs Autonomous Agent

## Scope and disposition

- Created `content/patterns/agt-p-01-workflow-vs-autonomous-agent.mdx` only for AGT-P-01.
- Modified `tests/agt-patterns-content.test.mjs` and the AGT-P-01 document projection in `data/source-ledger.json`.
- Did not modify `.superpowers/sdd/progress.md`, later Pattern articles, generated projections, Pattern group data, or link-health observations.
- Planned commit: `feat(agentic): add workflow versus agent pattern`.

## RED evidence

### Article contract

After adding the metadata, heading, decision-matrix, visible-copy, mutation, and no-visual tests, but before creating the article:

```text
node --test tests/agt-patterns-content.test.mjs
tests 5; pass 2; fail 3
```

All three new tests failed for the expected single reason:

```text
Missing content/patterns/agt-p-01-workflow-vs-autonomous-agent.mdx
```

The two pre-existing Pattern-group tests remained green.

### Source-governance contract

The source-ledger document entry was removed before adding its exact governed-source contract. The focused rerun then produced:

```text
tests 6; pass 5; fail 1
AssertionError: content/patterns/agt-p-01-workflow-vs-autonomous-agent.mdx source document
```

The minimum document citation entry was then restored. No source identity or network-health observation was created or changed.

## GREEN evidence

Final focused result:

```text
node --test tests/agt-patterns-content.test.mjs
tests 6; pass 6; fail 0
```

The contract now locks:

- standard Pattern `knowledgeTypeContracts.pattern` headings: exactly 11 H2 sections in canonical order;
- exact metadata, `depends_on: [AGT-C-01, AGT-C-03]`, approved adjacency, and the three production validation cases;
- one reader-visible six-column decision matrix with exactly four rows and exact identities:
  - `已知步骤/低不确定性`;
  - `开放步骤/可验证结果`;
  - `高风险副作用`;
  - `长时可恢复任务`;
- every decision cell is non-empty; the four axes and recommended control form preserve the approved row-specific copy;
- physical GFM column counts, AST table identity, structural mutations, empty and incorrect mutations for each approved cell, an extra-column mutation, and missing-row identities;
- reader-visible progressive path `deterministic code → workflow with model step → bounded agent loop → durable/multi-agent`;
- hidden HTML comments, fenced code, and `hidden` JSX cannot satisfy decision or progression contracts;
- no Markdown image, image reference, case-insensitive Mermaid diagram, renderable MDX expression, visual ESM import, unresolved JSX attribute, visual resource attribute, image role, background URL, or unknown custom component.

Additional focused repository evidence:

```text
node --test tests/agt-patterns-content.test.mjs tests/agt-foundations-content.test.mjs \
  tests/content-registries.test.mjs tests/topic-manifest.test.mjs \
  tests/content-relations.test.mjs tests/content-validation.test.mjs
tests 126; pass 126; fail 0

node --test tests/agt-patterns-content.test.mjs tests/source-ledger.test.mjs \
  tests/source-license-inventory.test.mjs tests/source-link-health.test.mjs
tests 109; pass 109; fail 0

npm run validate:content
Validated 114 content document(s) and 569 registered source(s).

npm run check:terminology
checked 116 files with 154 registered terms; 0 issues

npm run check:links
PASS

git diff --check
PASS
```

The Foundations reciprocal contract passes with AGT-C-01 and AGT-C-03 both retaining AGT-P-01, while AGT-P-01 declares both reverse edges.

A fresh repository-wide `npm test` audit completed with `1355` tests, `1341` passing and `14` failing. None is an AGT-P-01 focused contract failure. The exact remaining full-suite set is:

- five corpus-count snapshots that still expect the pre-P01 document/summary scan totals: `content-review-health` (1), `project-status` (1), `terminology-policy` (2), and `visible-copy` (1); these are final projection/count updates owned by the later phase gate, not this three-file article task;
- one `topic-index` failure because generated Pattern assignments have not been regenerated; owned by Patterns Task 10 after all eight routes exist;
- three historical Stage-B snapshot tests (`g008-batch3`, `g009-batch12`, `g009-batch9`) reading intentionally stale generated corpus/source totals; owned by the later deterministic projection gate;
- one pre-existing quality-attribute URL-multiset assertion for the Foundations AGT-C-06 reciprocal link, unrelated to AGT-P-01;
- four `source-ledger-pagination` production-build assertions, all failing from the exact unpublished Pattern/Case links listed below; their targets are owned by Patterns Tasks 3–9 and Cases Tasks 2–4.

The full suite was run as an audit only. Updating unrelated historical snapshots, generated projections, source-pagination fixtures, or broken-link policy would violate this task's scope and phased plan.

## Content and control contract

The article makes task uncertainty, result verifiability, side-effect risk, and execution duration independent decision axes. It does not present Agent as more advanced than Workflow. The deterministic path remains preferred for known steps, unverifiable outcomes, or high-risk effects that cannot be safely delegated.

Control owner, state owner, allowed side effects, four terminal outcomes, failure evidence, recovery authority, quality trade-offs, migration gates, and deterministic fallback are reader-visible. High-risk actions remain behind deterministic policy, approval, stable operation identity, and result verification. Long duration first adds durable state/checkpoint/recovery; it does not automatically justify multi-Agent control.

## Source boundary

The article reuses exactly two pre-existing governed identities:

1. `src-anthropic-building-effective-agents` — definition/method, first-party, `facts-summary`, manifest primary;
2. `src-openai-practical-guide-building-agents` — definition/method, first-party, `facts-summary`, non-primary supporting citation.

Only narrow first-party claims are used: each publisher's workflow/agent control distinction, dynamic tool/process selection, loop/exit boundary, and incremental or deterministic adoption guidance. The four-axis matrix, six-plane ownership table, progression contract, fallback triggers, and scenario are marked as Tego Arch synthesis. The article explicitly says the two publishers' taxonomies are not an industry standard and makes no production-reliability inference.

Both existing transports already have `healthy` committed observations and exact source-ID coverage. `data/source-link-health.json` was therefore not modified. There are no quotation, adapted-text, copied diagram, or illustration citations.

## No-visual decision

Format decision: `无需图`.

Decisive criteria: the architectural job is a four-row, four-axis comparison plus recommendation. A diagram would repeat the adjacent decision matrix and obscure exact cell semantics. The final MDX contains no image, Mermaid, Draw.io, SVG, raster asset, or source-ledger illustration entry. Text/topology/asset responsive QA is therefore not applicable; table structure and reader visibility are enforced through MDX AST plus physical GFM checks. No visual source registration gap exists.

## Dry generation disposition and exact remaining blockers

`npm run check:content` was used as the required dry disposition. It exited 1 before generation with 39 later-owned unpublished-target diagnostics. No generated file was edited manually or by `generate:content`.

AGT-P-01 publication removed the two former blockers:

- AGT-C-01 → AGT-P-01;
- AGT-C-03 → AGT-P-01.

It exposed the approved AGT-P-01 outbound edges, which remain intentionally blocked until their named tasks publish the targets:

- AGT-P-01 → AGT-P-02 through AGT-P-08: 7 diagnostics, owned respectively by Patterns Tasks 3 through 9;
- AGT-P-01 → `/cases/multi-agent-research-system`: Cases Task 2;
- AGT-P-01 → `/cases/long-running-coding-agent`: Cases Task 3;
- AGT-P-01 → `/cases/production-incident-response-agent`: Cases Task 4.

The other 29 diagnostics predate this task and remain owned by the same downstream tasks:

- AGT-C-02: AGT-P-06, AGT-P-08, and long-running Coding Agent case (3);
- AGT-C-03: AGT-P-02 through AGT-P-08 and all three new cases (10);
- AGT-C-04: AGT-P-02, AGT-P-06, AGT-P-07, AGT-P-08, and all three new cases (7);
- AGT-C-05: AGT-P-08, long-running Coding Agent case, and incident-response case (3);
- AGT-C-06: AGT-P-02, AGT-P-04, AGT-P-08, and all three new cases (6).

There are zero AGT-P-01 content, metadata, reciprocal-edge, citation, source-health, terminology, or focused-test defects in this remaining set. The repository-wide generation gate remains deferred exactly as authorized by the approved phased plan.

## Self-review

- Scope: only the requested MDX, Pattern test, source-ledger document entry, and this report changed.
- Contract: all 11 headings, exact metadata, exact four decision identities, progression string, ownership/failure/recovery/fallback requirements, and visible reciprocal links are present.
- Evidence: first-party claims stay within governed `usage_boundary`; publisher taxonomies are explicitly not generalized to an industry standard.
- Safety: model-selected steps do not own hard limits, authority state, or write authorization; unknown effects stop automation.
- Visuals: no visual asset or hidden visual embed was introduced.
- Governance: health cache and generated projections are untouched; no unresolved drafting marker or copied structure was added.
- Test quality: the original suite protected structure and selected recommendations; the corrective suite below records the broader per-cell and fail-closed guarantees added after review.
- Formatting: `git diff --check` passes.

## Corrective quality review

### Corrective RED

The review identified that the first contract used permissive cell regexes and a narrow visual-tag denylist. Tests were changed first, without changing the contract implementation. The focused run then failed exactly as intended:

```text
node --test tests/agt-patterns-content.test.mjs
tests 8; pass 6; fail 2
```

The first failing test reported all five reviewer survivors:

- high-risk verification changed from `执行前后均须权威验证` to `无需任何验证`;
- long-running side effects changed from `只允许可去重、可补偿动作` to `允许不可逆写入`;
- the known-step recommendation changed to `自治优先<span hidden>确定性代码</span>`;
- an `ArchitectureDiagram` custom component was added;
- a static semantic container was changed to `role="img"`.

The second failing test reported all four public metadata survivors: `title`, `tags`, `summary`, and `related_questions`.

### Corrective GREEN and exact protection

The final focused contract passes:

```text
node --test tests/agt-patterns-content.test.mjs
tests 11; pass 11; fail 0
```

The decision matrix now compares its AST-derived, reader-visible rows with the exact approved 4-by-6 matrix. This protects all four identities and all five non-identity cells per row. The systematic mutation set supplies both an empty value and a non-empty wrong value for every cell, including the 20 required non-identity cells. The two reviewer prose substitutions and hidden-text recommendation are also explicit named regressions.

Cell text uses the AGT-C-06-reviewed fail-closed reader model: `hidden`, non-false `aria-hidden`, `display: none`, `visibility: hidden`, unresolved attributes, code, inline code, MDX expressions, ESM, raw HTML, and unknown custom components cannot contribute decision evidence. Dedicated mutants exercise static and object styles, inline code, a renderable text expression, and a dynamic hidden state.

The no-visual AST contract now rejects Markdown images and references, case-insensitive Mermaid, unknown/custom visual components, direct or fallback-list `role="img"`, `src`, `data`, `poster`, `srcSet`, dynamic or spread attributes, direct or CSS-variable background resources, dynamic styles, renderable flow/text expressions, and relevant visual component or asset ESM imports. Imported custom-component bindings require exact approved provenance, and local declarations cannot impersonate `Callout`. Static known non-visual `Callout` and ordinary `div.table-wrapper` containers remain accepted. Twenty-six representative visual or indeterminate mutants have zero survivors.

Exact public metadata is now asserted and mutation-tested. The canonical fixture and backlog establish the AGT-P-01 identity and route; the design and Pattern plan establish the Workflow-versus-Agent scope and no-visual disposition; the reviewed article supplies the approved Chinese public title, ordered tags, summary, and empty `related_questions` value.

Fresh corrective verification:

```text
node --test tests/agt-patterns-content.test.mjs tests/agt-foundations-content.test.mjs \
  tests/content-registries.test.mjs tests/topic-manifest.test.mjs \
  tests/content-relations.test.mjs tests/content-validation.test.mjs
tests 131; pass 131; fail 0

node --test tests/agt-patterns-content.test.mjs tests/source-ledger.test.mjs \
  tests/source-license-inventory.test.mjs tests/source-link-health.test.mjs
tests 114; pass 114; fail 0

npm run validate:content
Validated 114 content document(s) and 569 registered source(s).

npm run check:terminology
checked 116 files with 154 registered terms; 0 issues

npm run check:links
PASS

git diff --check
PASS
```

The earlier relation evidence is corrected from the stale `125/125` transcription to its fresh pre-corrective `126/126` result. The five additional corrective tests account exactly for the current `131/131` result.

### Corrective source, visual, and blocker disposition

The article and governed source projection did not need correction. The contract still reuses only `src-anthropic-building-effective-agents` and `src-openai-practical-guide-building-agents` within their first-party definition/method boundaries. No source identity, citation, transport, license, or link-health observation changed.

The `无需图` disposition is unchanged. The corrective work strengthens enforcement only; it adds no illustration, diagram, asset, visual citation, or health entry.

`npm run check:content` still exits 1 with the same 39 later-owned unpublished-target diagnostics documented above: 10 AGT-P-01 outbound edges and 29 pre-existing Foundation edges. No new diagnostic appeared, and neither previously removed reciprocal edge returned. Generated files remain untouched.

Corrective self-review found no article wording or source-boundary change necessary. The diff is limited to the Pattern contract and this report, the reviewer survivors are named tests, all 20 non-identity matrix cells receive empty and wrong mutations, visible evidence is fail-closed, the no-visual rule has explicit acceptance fixtures, and the requested focused/governance checks are fresh.

### Independent review follow-up

The pre-commit read-only review found three additional fail-closed classes: visibility delegated through a CSS custom property, a background URL delegated through a CSS custom property, and unknown ESM bindings that could impersonate `Callout` or import `Chart`. These were again added to the mutation suites before the helpers changed. The focused RED result was:

```text
tests 11; pass 9; fail 2
decision survivors: custom-property hidden display
visual survivors: custom-property background URL; externally unresolved background variable;
  unknown renderer aliases the Callout binding; Chart component import
```

The reader model now treats `var()` and `env()` in `display` or `visibility` as indeterminate and therefore non-evidence. The visual contract rejects visual-resource functions in every inline-style value, rejects indeterminate background values, extends visual ESM identities to charts and graphs, requires exact source/name provenance for imported custom components, and rejects local declarations that shadow an approved component identity. A local-`Callout` declaration mutant was added as a further binding-provenance check.

After those fixes, focused tests returned `11/11`, relations/manifest/content contracts `131/131`, source governance `114/114`, content validation and link cache passed, terminology returned `116 files / 154 terms / 0 issues`, `git diff --check` passed, and `check:content` remained the same exact 39 later-owned diagnostics.

A second read-only pass found CSS comments after `display:none`, an ARIA fallback role list containing `img`, and the missing `.ico` asset extension. Adding those three valid-MDX mutants first produced `11 tests / 9 pass / 2 fail` with exactly those survivors. Static CSS comments now fail closed, role values are tokenized, and the visual extension set covers APNG, AVIF, BMP, GIF, HEIC/HEIF, ICO, JPEG, JXL, PNG, SVG, TIFF, and WebP. The final focused rerun returned `11/11` and `git diff --check` passed.
