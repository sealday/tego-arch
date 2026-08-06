# Task 6 Report: Quality Attribute Terminology Localization

## Outcome

- Localized the reader-facing terminology in the quality-attribute index and all eleven QA articles.
- Standardized the six scenario headings as `来源（Source）`, `刺激（Stimulus）`, `环境（Environment）`, `对象（Artifact）`, `响应（Response）`, and `响应度量（Response Measure）`.
- Kept slugs, routes, external URLs, source identities, code literals, commands, field names, and governed literature titles intact.
- Corrected the Safety title and consistently separated `安全保障（Safety）` from `安全性（Security）`; normalized `人在回路（Human-in-the-loop）` usage.

## TDD Evidence

- RED: after changing schema/test expectations first, `node --test tests/content-validation.test.mjs tests/g006-batch1-content.test.mjs` failed in exactly three places because the schema and article headings still used the old English field names.
- GREEN: after updating the schema and the first article batch, the same command passed 51/51 tests.
- Final targeted suite: 65/65 tests passed across content validation and all G006 QA batches.

## Terminology Governance

- The first directory scan reported 798 issues.
- Added one composite registry item for the fixed scenario-field heading contract rather than registering ordinary Chinese words such as `来源`, `环境`, or `响应` globally.
- Added the durable semantic distinctions `安全保障（Safety）`, `安全性（Security）`, and `隐私（Privacy）`.
- Final scoped scan: 12 files checked with 39 registered terms and 0 issues.

## Verification

- `node scripts/check-terminology.mjs --paths content/quality-attributes` -> 12 files, 0 issues.
- Targeted content tests -> 65 passed, 0 failed.
- `npm run validate:content` -> 95 content documents and 494 registered sources validated.
- `npm run typecheck` -> passed.
- `npm run build` -> production build succeeded.
- `npm test` -> 866 passed, 2 failed; both failures are the pre-existing 94-versus-95 content-document count assertions in `content-review-health.test.mjs` and `project-status.test.mjs` that the parent task explicitly allowed.
- `git diff --check` -> passed.

## Review Notes

- A transient QA-03 edit changed an illustration/source URL and spacing during the first controlled pass. The exact URLs were restored immediately, and the page subsequently passed the single-file terminology check.
- The first production build exposed an MDX-incompatible HTML suppression comment in QA-01. The comment was removed and the prose was rewritten without a suppression; the subsequent build passed.
- A final semantic review removed duplicated wording and stray spaces in QA-09 before completion.
