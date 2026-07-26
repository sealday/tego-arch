# Tego Arch Canonical Rename and Status Design

**Date:** 2026-07-26

**Status:** Approved

**Canonical repository:** `sealday/tego-arch`

**Canonical site:** `https://sealday.github.io/tego-arch/`

## Goals

1. Rename the active project identity from Agentic Architecture Atlas to **Tego Arch**, with the Chinese descriptor **软件架构知识图谱**.
2. Make `sealday/tego-arch` and `https://sealday.github.io/tego-arch/` the only active repository and Pages identities.
3. Publish a generated, read-only `/status` page showing exactly:
   - durable stories: `5 / 20`;
   - completed topics: `11`;
   - content documents: `56`;
   - governed sources: `394`;
   - current story: `G006`.
4. Preserve `docs/content-backlog.md` as the only manually maintained task-status source.
5. Preserve all historical specs, plans, review records, commit links, Pages links, and historical evidence as history.

## Non-goals

- No custom domain, redirect service, compatibility deployment, or dual Pages base path.
- No promise that the old Pages URL remains available; discontinuity is accepted.
- No reuse of the old repository slug after the rename.
- No rewriting of historical `docs/superpowers/specs/`, `docs/superpowers/plans/`, or completed evidence rows.
- No manually edited status JSON or generated source-ledger output.
- No new dependency, CMS, database, or second task tracker.

## Architecture and source ownership

Active identity is owned by `docusaurus.config.ts`, `package.json`, `package-lock.json`, active homepage/intro copy, workflow-adjacent code, and active tests. Canonical self-authored evidence is owned by `data/source-ledger.json` and `docs/source-license-inventory.md`; `src/generated/source-ledger.json` remains generator output.

`docs/content-backlog.md` owns human-written progress. Its top baseline is updated from the stale G004 record to the already completed G005 evidence and explicitly states `5 / 20` durable stories complete and `G006` current. Existing lower historical evidence remains unchanged.

`scripts/project-status.mjs` derives a strict status object from:

- the durable-story baseline in `docs/content-backlog.md`;
- parsed topic checkboxes from `scripts/backlog-topics.mjs`;
- validated documents returned by `scripts/content-metadata.mjs`;
- canonical sources in `data/source-ledger.json`.

`scripts/generate-content-platform.mjs` serializes that object as `src/generated/project-status.json` in the same staged, verified transaction as the other generated artifacts. `src/pages/status.tsx` renders only that generated projection. Any missing, duplicate, malformed, or contradictory baseline fails generation.

## Migration order

1. Add failing identity, status-model, generated-artifact, and page tests.
2. Update canonical package/config/content/test identity and self-authored ledger/inventory evidence.
3. Add strict status parsing and generated projection; regenerate all artifacts only with `npm run generate:content`.
4. Add `/status`, update homepage branding, and keep status values imported from the generated artifact.
5. Run targeted tests, full `npm run verify`, and local production smoke at `/tego-arch/` and `/tego-arch/status`.
6. Rename the GitHub repository to `sealday/tego-arch`, update the local remote, push the implementation commit, wait for Pages, and smoke the canonical live routes.
7. Record Stage A deployment evidence in `docs/reviews/g006-rename.md`, push that evidence commit as Stage B, wait for its Pages deployment, and repeat live smoke.

## Failure handling

- Identity scans fail if active files retain the old brand, repository slug, or Pages base path. Historical documentation is outside this active-file assertion.
- Status generation fails closed when the backlog baseline is absent or not exactly one completed/current durable-story declaration, when counts disagree with canonical inputs, or when the current story is not `G006`.
- Generated artifacts are never repaired by hand. A mismatch is fixed in canonical inputs or generator code and regenerated.
- If the repository rename succeeds but push or Pages fails, do not recreate or reuse the old slug. Keep `origin` on `sealday/tego-arch`, diagnose the failed run, and retry the canonical deployment.
- Stage B is not created until Stage A Pages success and live-smoke evidence exist.

## Tests and deployment

TDD protects exact Docusaurus identity, package metadata, absence of `static/CNAME`, canonical self-authored evidence, backlog-only status ownership, strict status derivation, generated-artifact freshness, status-page rendering, and preservation of historical files. Full verification remains `npm run verify`.

Local smoke serves `build/` and verifies the base path, homepage title/descriptor, `/status`, and representative content routes. Deployment uses the existing pinned GitHub Pages workflow. Live smoke requires HTTP success plus expected body text at the canonical homepage, `/status`, and representative content routes; the obsolete Pages URL is not an acceptance target.

## Acceptance

- Active identity is Tego Arch / 软件架构知识图谱.
- Repository and Pages identities are exactly `sealday/tego-arch` and `https://sealday.github.io/tego-arch/`.
- No custom domain exists and the old repository slug is not reused.
- `/status` is generated/read-only and displays `5 / 20`, `11`, `56`, `394`, and `G006` from canonical inputs.
- `docs/content-backlog.md` is still the only manually maintained task source and its top baseline records completed G005 evidence.
- Historical specs, plans, reviews, and evidence links remain intact.
- Package metadata and canonical self-authored source evidence use the new identity; generated ledger output is regenerated, not hand-edited.
- Targeted tests, `npm run verify`, local production smoke, repository rename, Stage A deploy/live smoke, Stage B evidence deploy/live smoke, and final clean-tree checks all pass.
