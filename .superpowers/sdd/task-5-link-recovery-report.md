# Task 5 Link Recovery Report

## Status

COMPLETE. The two ISO sources retain their existing canonical citation identities and rights boundaries while using healthy official ISO committee work pages as checker transports. Google Cloud elasticity and the pinned Temporal GitHub source recovered through real requests without changing their canonical locators, transports, expected-final approvals, or stable policies. The committed cache has no stale results.

## Schema rationale

The source ledger previously required `canonical_locator` and `transport_locator` to identify the same URL except for approved query-insensitive differences. That made the requested state impossible to represent: the ISO `www` work page must remain the citation identity, while the equivalent official `committee` work page must become the request transport.

The validator now keeps those responsibilities separate:

- `canonical_locator` and alias `locator` values are citation identities.
- `citationMatchesSource` accepts only canonical and alias locator identities, with the existing query-insensitive normalization.
- A source `transport_locator` may be a different canonical, fragment-free HTTPS checker URL when the required expected-final approval fields are present.
- A decoupled transport URL does not become a valid citation merely because the checker uses it.
- Existing canonical-form, HTTPS, alias, expected-final, uniqueness, and policy validation remains active.

Regression tests prove that an approved cross-origin checker transport is accepted, the canonical citation remains accepted, a transport-only citation is rejected, and non-canonical HTTP, uppercase-scheme, and fragment-bearing transports remain rejected.

## ISO transport migration

Audit date: 2026-07-28.

- `src-iso-42010-2022`
  - canonical identity retained: `https://www.iso.org/standard/74393.html`
  - checker transport: `https://committee.iso.org/standard/74393.html`
  - observed twice as healthy HTTP 200 with no redirect or login wall
- `src-iso-11f3b103e932`
  - canonical identity retained: `https://www.iso.org/standard/78176.html`
  - checker transport: `https://committee.iso.org/standard/78176.html`
  - observed twice as healthy HTTP 200 with no redirect or login wall

Both expected-final approvals were renewed to `2026-07-28`. Their approval notes state that repeated Cloudflare HTTP 403 responses on the `www` transport led to migration to the equivalent official ISO committee work page. They do not classify the failures as authentication-required.

The source IDs, titles, canonical locators, all document citation URLs, `LicenseRef-Proprietary-Standard` license, copyright policies, license evidence, and usage boundaries remain unchanged.

## Cache audit and history handling

The repository refresh workflow was run twice:

```bash
bun run refresh:links
```

The first refresh generated `2026-07-28T10:56:40.010Z`. Both ISO committee transports were healthy HTTP 200 and Temporal recovered at HTTP 206. Google Cloud remained a real `fetch failed` stale observation, so the command truthfully exited 1.

The bounded retry generated `2026-07-28T10:59:10.028Z`. Google Cloud recovered at HTTP 200; Temporal, both ISO committee pages, and all other stable-policy results were accepted. The command exited 0.

Material audit evidence retained:

- Google Cloud elasticity: the prior errors, the first refresh error, and the second refresh HTTP 200 recovery.
- Temporal pinned `matching_engine.go`: the prior HTTP 504 failure and both fresh HTTP 206 recovery observations.
- Both ISO committee transports: both fresh HTTP 200 observations.
- Two unrelated NIST transports whose full refreshes produced real HTTP 206 → 200 → 206 status transitions.

Exactly 414 unrelated entries whose appended observations were strictly timestamp-only and semantically identical were restored to their prior records. No failure, recovery, HTTP-status transition, final-transport change, authentication/retirement outcome, or policy change was removed.

Old ISO `www` cache histories cannot structurally remain after the migration because link-health results are keyed by the active `transport_locator`. The ledger approval notes preserve the reason for the key migration, and this report records the displaced `www` history: both old transports had healthy HTTP 200 histories followed by repeated HTTP 403 observations at `2026-07-28T09:50:16.450Z` and `2026-07-28T10:05:05.144Z`.

Final cache facts:

```text
generated_at=2026-07-28T10:59:10.028Z
result_count=420
current_stale_results=0
reverted_timestamp_only_entries=414
```

## Files changed

- `data/source-ledger.json` — migrated only the two ISO checker transports and their expected-final approvals.
- `data/source-link-health.json` — retained actual migration, failure, recovery, and status-transition observations while removing timestamp-only churn.
- `scripts/source-ledger.mjs` — separated canonical/alias citation identity from an approved checker transport.
- `tests/source-ledger.test.mjs` — added transport-decoupling and transport-only citation regressions.
- `tests/source-governance-data.test.mjs` — locked the exact ISO identity, transport, rights, and boundary contract.
- `src/generated/source-ledger.json` — regenerated deterministic public source-ledger projection.

## Verification

TDD RED:

```bash
node --test --test-name-pattern='uses official ISO committee work pages' tests/source-governance-data.test.mjs
```

Result: FAIL as expected because both ISO transports still pointed to `www.iso.org`.

Targeted governance and link-health suite:

```bash
node --test tests/source-ledger.test.mjs tests/source-link-health.test.mjs tests/source-governance-data.test.mjs tests/canonical-identity.test.mjs
node scripts/source-link-health.mjs --check-cache
bun run check:content
```

Result: PASS after regenerating the deterministic projection; 68 targeted tests passed, cache policy passed, and generated content was current.

Full repository gate:

```bash
bun run verify
```

Result: PASS.

- Tests: 454 passed, 0 failed.
- Content validation: 76 documents and 443 registered sources.
- Deterministic content check: PASS.
- Link cache check: PASS.
- Content review health: PASS for 76 documents and 443 sources.
- Typecheck: PASS.
- Docusaurus production build: PASS.

Final hygiene:

```bash
git diff --check
```

Result: PASS.
