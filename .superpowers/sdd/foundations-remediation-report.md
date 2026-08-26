# Foundations remediation report

## Scope and root cause

This remediation fixes the 21 Foundations-owned defects exposed after the
`agent-control` registry began allowing the topic-manifest graph validation to
run to completion. A fresh `npm run check:content` reproduced 52 errors.
Programmatic classification identified exactly:

- 6 AGT-C priority mismatches;
- 15 missing reverse edges for already-published knowledge topics;
- 19 references to later-owned unpublished AGT-P routes;
- 12 references to later-owned unpublished Case routes.

The priority root cause was authority drift: `buildTopicManifest` parses
`docs/content-backlog.md` and treats each matching backlog row as the canonical
priority, while all six AGT-C frontmatter blocks declared `P0` although their
backlog rows declare `P1`.

The adjacency root cause was an incomplete two-sided update. The six approved
AGT-C frontmatter blocks declared forward adjacency, but the existing target
documents were not updated with the reciprocal topic IDs. The validator builds
the published topic map from frontmatter, then checks every published source
edge against the target topic's `adjacent_topics`. Removing the approved source
edges would hide the symptom and violate the design, so this remediation adds
only the missing reverse edges.

The tested hypothesis was: reconciling the six priorities with the backlog and
adding the 15 reverse edges, without removing any approved forward edge, will
reduce `check:content` from 52 errors to exactly the 31 later-owned missing-route
errors. The post-fix result confirms that hypothesis.

## RED and GREEN evidence

Before any content change, two focused contracts were added:

1. derive each AGT-C priority from the parsed canonical backlog and assert the
   backlog value is `P1`;
2. assert the complete approved adjacency array for every AGT-C article, then
   require a reverse edge from every target that is already published.

Historical exact-array and visible-navigation contracts for QA-08, PR-07,
PR-09, and PR-10 were strengthened in the same RED step.

RED was observed with the expected causes:

- `AGT-C-01 frontmatter priority follows the canonical backlog`: `P0 !== P1`;
- `AGT-C-01 -> AGT-C-02 has reverse edge AGT-C-02 -> AGT-C-01`: false;
- the four existing target-page contracts rejected the missing metadata and
  visible reverse navigation.

After the minimal content change, the focused Foundations and affected legacy
contracts pass `50/50`. Topic manifest, content relations, content validation,
and registry tests pass `88/88`.

## Exact priority and adjacency changes

All six priority fields changed from `P0` to backlog-authoritative `P1`:

- `AGT-C-01`, `AGT-C-02`, `AGT-C-03`, `AGT-C-04`, `AGT-C-05`, `AGT-C-06`.

The 15 reciprocal edges were resolved by canonical `topic_id`, not by filename
inference:

| Approved source edge | Added reverse edge | Canonically resolved target file |
| --- | --- | --- |
| `AGT-C-01 -> AGT-C-02` | `AGT-C-02 -> AGT-C-01` | `content/concepts/agt-c-02-agent-harness.mdx` |
| `AGT-C-01 -> AGT-C-03` | `AGT-C-03 -> AGT-C-01` | `content/concepts/agt-c-03-agent-loop.mdx` |
| `AGT-C-02 -> AGT-C-03` | `AGT-C-03 -> AGT-C-02` | `content/concepts/agt-c-03-agent-loop.mdx` |
| `AGT-C-02 -> AGT-C-04` | `AGT-C-04 -> AGT-C-02` | `content/concepts/agt-c-04-context-memory-state-checkpoint.mdx` |
| `AGT-C-02 -> AGT-C-05` | `AGT-C-05 -> AGT-C-02` | `content/concepts/agt-c-05-tool-sandbox-permission-side-effect.mdx` |
| `AGT-C-02 -> AGT-C-06` | `AGT-C-06 -> AGT-C-02` | `content/concepts/agt-c-06-trace-evaluation-guardrail.mdx` |
| `AGT-C-03 -> AGT-C-04` | `AGT-C-04 -> AGT-C-03` | `content/concepts/agt-c-04-context-memory-state-checkpoint.mdx` |
| `AGT-C-03 -> AGT-C-05` | `AGT-C-05 -> AGT-C-03` | `content/concepts/agt-c-05-tool-sandbox-permission-side-effect.mdx` |
| `AGT-C-03 -> AGT-C-06` | `AGT-C-06 -> AGT-C-03` | `content/concepts/agt-c-06-trace-evaluation-guardrail.mdx` |
| `AGT-C-04 -> AGT-C-06` | `AGT-C-06 -> AGT-C-04` | `content/concepts/agt-c-06-trace-evaluation-guardrail.mdx` |
| `AGT-C-05 -> AGT-C-06` | `AGT-C-06 -> AGT-C-05` | `content/concepts/agt-c-06-trace-evaluation-guardrail.mdx` |
| `AGT-C-05 -> PR-09` | `PR-09 -> AGT-C-05` | `content/principles/pr-09-least-privilege-fail-safe-defaults-defense-in-depth.mdx` |
| `AGT-C-05 -> PR-10` | `PR-10 -> AGT-C-05` | `content/principles/pr-10-idempotency-minimal-coordination.mdx` |
| `AGT-C-06 -> QA-08` | `QA-08 -> AGT-C-06` | `content/quality-attributes/qa-08-operability-observability.mdx` |
| `AGT-C-06 -> PR-07` | `PR-07 -> AGT-C-06` | `content/principles/pr-07-fail-fast-fail-safe-graceful-degradation.mdx` |

The AGT-C arrays retain all design-approved forward edges and place reciprocal
AGT-C IDs in topic order before their existing Pattern/principle/quality
relations. Existing target-page arrays retain their established order and
append the new AGT-C edge. The four older target pages also gained one precise,
visible navigation sentence each, as required by the content-relations gate.

## Exact changed files

Content:

- `content/concepts/agt-c-01-agent-system-boundary.mdx`
- `content/concepts/agt-c-02-agent-harness.mdx`
- `content/concepts/agt-c-03-agent-loop.mdx`
- `content/concepts/agt-c-04-context-memory-state-checkpoint.mdx`
- `content/concepts/agt-c-05-tool-sandbox-permission-side-effect.mdx`
- `content/concepts/agt-c-06-trace-evaluation-guardrail.mdx`
- `content/principles/pr-07-fail-fast-fail-safe-graceful-degradation.mdx`
- `content/principles/pr-09-least-privilege-fail-safe-defaults-defense-in-depth.mdx`
- `content/principles/pr-10-idempotency-minimal-coordination.mdx`
- `content/quality-attributes/qa-08-operability-observability.mdx`

Focused contracts:

- `tests/agt-foundations-content.test.mjs`
- `tests/g006-batch3-content.test.mjs`
- `tests/g007-batch2-content.test.mjs`
- `tests/g007-batch3-content.test.mjs`

No Pattern page, Case page, backlog checkbox, progress record, generated
projection, or publication state was changed.

## Remaining 31 errors and owners

`npm run check:content` now reports exactly 31 errors, with zero priority
mismatches, zero missing reverse edges, and zero other categories.

Pattern owner — 19 unpublished AGT-P targets:

- AGT-C-01: `AGT-P-01` (1);
- AGT-C-02: `AGT-P-06`, `AGT-P-08` (2);
- AGT-C-03: `AGT-P-01` through `AGT-P-08` (8);
- AGT-C-04: `AGT-P-02`, `AGT-P-06`, `AGT-P-07`, `AGT-P-08` (4);
- AGT-C-05: `AGT-P-08` (1);
- AGT-C-06: `AGT-P-02`, `AGT-P-04`, `AGT-P-08` (3).

Case owner — 12 unpublished Case targets:

- AGT-C-02: `long-running-coding-agent` (1);
- AGT-C-03: `multi-agent-research-system`, `long-running-coding-agent`,
  `production-incident-response-agent` (3);
- AGT-C-04: the same three targets (3);
- AGT-C-05: `long-running-coding-agent`,
  `production-incident-response-agent` (2);
- AGT-C-06: all three targets (3).

## Verification and generator disposition

- Fresh baseline `npm run check:content`: expected failure, 52 exact errors.
- Foundations plus affected legacy tests: `50/50` pass.
- Topic manifest/content relations/content validation/registries: `88/88`
  pass.
- `npm run validate:content`: pass, 113 documents and 569 registered sources.
- `npm run check:terminology`: pass, 115 files, 154 registered terms, zero
  issues.
- `npm run check:links`: pass against the reviewed cache.
- Post-fix `npm run check:content`: expected failure with exact disposition
  `31 = 19 Pattern + 12 Case`, Foundations `0`, other `0`.
- `npm run generate:content`: expected failure on those same 31 later-owned
  routes before artifact staging or replacement. Generated-file SHA-256 and
  changed-name snapshots are identical before and after; no
  `.content-platform-stage` directory remains.
- `git diff --check`: pass after the final report update.
