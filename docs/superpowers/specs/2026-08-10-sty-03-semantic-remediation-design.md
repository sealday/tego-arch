# STY-03 Semantic Remediation Design

**Date:** 2026-08-10  
**Status:** Approved continuation remediation  
**Parent plan:** `docs/superpowers/plans/2026-08-08-sty-03-vertical-slice-architecture.md`

## Problem

The STY-03 article correctly says `SubmitOrder Handler` coordinates the use case, but the published diagram assigns downstream runtime control to `Order Rules`. The diagram also places ports, response mapping, and an external adapter inside the `共享领域不变量` boundary, and its persistence path stops at `Order Store` without reaching the database. Geometry and source/projection tests passed because they locked parity and placement without testing architectural meaning.

The final review also found four release-governance gaps: the original diagram lacks an `original-illustration` source record, the archived eShopOnWeb repository is described as currently Microsoft-maintained, the original SubmitOrder scenario is labelled only at the end, and repository-wide current-state fixtures still describe the pre-STY-03 projection.

## Chosen approach

Use handler-centred orchestration and make the shared capabilities explicit.

- `SubmitOrder Handler` has separate runtime calls to `Order Rules`, `Inventory Port`, `Order Store`, and `Response Mapper`.
- `Inventory Port` dispatches at runtime to `Inventory Adapter`; the adapter has a dashed source dependency back to the port.
- `Order Store` dispatches at runtime to a new persistence adapter; the persistence adapter has a dashed source dependency back to `Order Store` and writes to the shared database.
- The layered repository and the vertical-slice persistence adapter reach the same shared database node inside the monolith deployment boundary.
- `共享领域不变量` contains only `Order Rules`. It is outside the `SubmitOrder` boundary but inside the monolith and vertical-slice comparison area.
- `SubmitOrder` contains the request entry, handler, ports, and response mapper. External adapters, the shared invariant capability, and the shared database are excluded.

This is preferred over changing the prose to match the old diagram because the prose reflects the intended architecture. It is also preferred over a boundary-only visual fix because that would leave the persistence and adapter runtime paths incomplete.

## Runtime and source-dependency contract

The final right-hand runtime inventory is:

1. `slice-http -> submit-order-handler`
2. `submit-order-handler -> order-rules`
3. `submit-order-handler -> inventory-port`
4. `inventory-port -> inventory-adapter`
5. `submit-order-handler -> order-store`
6. `order-store -> order-persistence-adapter`
7. `order-persistence-adapter -> shared-database`
8. `submit-order-handler -> response-mapper`

The right-hand source dependencies are:

1. `inventory-adapter -> inventory-port`
2. `order-persistence-adapter -> order-store`

The layered comparison retains its request, application, repository, database runtime flow and repository-to-service source-dependency example, but its database target becomes the single `shared-database` node.

## Boundary contract

- `deployment-boundary` contains every node and relation.
- `layered-boundary` contains the layered request/controller/service/repository nodes, but not the shared database.
- `vertical-slice-boundary` contains the SubmitOrder boundary, shared invariant capability, and both adapters, but not the shared database.
- `submit-order-boundary` contains the request, handler, both ports, and response mapper; it excludes `order-rules`, both adapters, and the shared database.
- `shared-domain-invariants` contains `order-rules` and no port, adapter, mapper, or database node.

Tests must calculate containment from actual Draw.io and SVG geometry rather than accept boundary names as proof.

## Content and evidence repair

- Restore the first governed uses `垂直切片架构（Vertical Slice Architecture）` and `Tego Arch 架构知识项目`.
- Mark the first detailed order flow as `说明性场景（Tego Arch 分析）`.
- Change “四种组织视角” to “三种组织视角”.
- Tighten the data-ownership comparison to “切片拥有用例专用模型；领域能力拥有权威状态”.
- Register `/img/diagrams/sty-03-vertical-slice-boundary.svg` as a project-authored `original-illustration` using `LicenseRef-Atlas-Original`, add it as a non-primary document citation, and regenerate license/source projections.
- Describe eShopOnWeb as an archived historical Microsoft reference whose README says active development moved and the current repository is community supported. Its fixed implementation evidence remains usable; no current-maintenance claim remains.

## Test and release repair

- Add semantic graph assertions before changing the diagram, including handler ownership, port-to-adapter runtime dispatch, adapter-to-port source dependencies, the persistence path, and exact boundary inclusion/exclusion.
- Fix the existing Map accessor bug in SVG visibility assertions so `class` and `aria-hidden` checks are effective.
- Re-run final 800px browser geometry measurements for every changed node and labelled relation.
- Run the canonical repository command `bun run test`; do not use raw `bun test` for the nested `node:test` suite.
- Synchronize only tests that intentionally read the current repository projection. Historical evidence must remain frozen or use frozen fixtures.
- Keep STY-03 published/pending and STY-04 unpublished/pending until the Stage A production deployment succeeds. Only then update the backlog, regenerate to STY-03 complete and 56 completed topics, and run the final exact-head verification.

## Success criteria

- Article, Draw.io, SVG, and tests agree on handler-centred orchestration and boundary ownership.
- The persistence path reaches the one shared database.
- Original-illustration licensing and archived-source identity are explicit and validator-clean.
- Diagram validation, exact 800px geometry, content/source/terminology checks, `bun run test`, typecheck, and build all pass.
- Stage A production route and asset pass desktop/mobile QA before backlog closure.
- Final closure keeps STY-04 pending and records exact Pages evidence.

## Self-review

- Placeholder scan: no TBD, TODO, or deferred implementation language.
- Internal consistency: runtime edges, source dependencies, containment, article claims, and release staging use one contract.
- Scope: limited to STY-03 semantic correctness, directly affected current-projection fixtures, and the existing release closure.
- Ambiguity: the shared database is one node; duplicate database symbols are forbidden because they could imply independent data ownership.
