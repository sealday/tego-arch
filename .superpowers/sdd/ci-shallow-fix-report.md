# Stage B CI shallow-checkout fix report

## Status

DONE

## Root cause

- GitHub Actions run `30215501469` verified exact head
  `f51aab1102d71d77cda8dbcecaa8a5a88d0a70a2`.
- `tests/g006-batch1-deployment.test.mjs` intentionally resolves the recorded
  Stage A evidence SHA
  `6d98e6f78a36f6c4abddeccb4f8fc6770a88d4c7^{commit}`.
- The deploy workflow used pinned `actions/checkout` without `fetch-depth`, so
  its default depth of one omitted the earlier evidence commit. The immutable
  deployment test therefore failed in CI even though it passed in a local
  full-history checkout.
- The test and deployment evidence remain unchanged. The build checkout now
  uses `fetch-depth: 0`, making all recorded evidence commits available to
  verification across deployments.

## TDD evidence

- RED:
  `node --test tests/workflow-configuration.test.mjs` failed the new
  `checks out complete history before verifying immutable deployment evidence`
  regression. Result: 5 tests, 4 passed, 1 failed. The failure showed that the
  pinned checkout step lacked `with: fetch-depth: 0`.
- GREEN: after adding only `fetch-depth: 0` to the pinned checkout step, the
  same command passed 5/5 with 0 failures.

## Commit

- Implementation commit:
  `3085894480a7bad5a48ec0e2adeabba1ded55dd6`
- Subject: `fix: fetch deployment verification history`
- Push: not performed

## Verification

- `node --test tests/workflow-configuration.test.mjs` — PASS, 5 tests, 0
  failures.
- `npm run verify` — PASS:
  - Node suite: 372 tests, 372 passed, 0 failed.
  - Content validation: 59 documents and 402 registered sources.
  - Generated content, offline link cache, and content review health checks:
    PASS.
  - TypeScript `tsc --noEmit`: PASS.
  - Docusaurus production build: PASS; only the existing Node `localStorage`
    experimental warnings were emitted.
- `git diff --check` — PASS.
