# Static local search review

**Review date:** 2026-08-28
**Implementation:** local production build
**Result:** PASS

## Build baseline

The production build generated exactly one hashed root search index. The repository validator recorded its filename, raw bytes, gzip bytes, indexed document entries, and unique URLs in the command output for `npm run check:search-index`.

The pinned plugin's filename hash follows its indexed content and plugin-version inputs; it does not independently include the Jieba dictionary bytes. Dictionary-only changes therefore require a clean deployment plus an explicit cache-invalidation and production-index check.

## Query acceptance

| Query | Observation | Result |
| --- | --- | --- |
| `微前端` | The single-spa case appeared within the first three results. | PASS |
| `限界上下文` | MOD-11 appeared within the first three results. | PASS |
| `CQRS` | PR-11 appeared within the first three results. | PASS |
| `适应度函数` | MTH-04 was returned. | PASS |
| `Kubernetes` | The Kubernetes reconciliation-loop case was returned. | PASS |
| `Kubernete` | The one-character typo still returned the Kubernetes reconciliation-loop case. | PASS |
| `龘靐齉xyz987` | The Chinese no-results message was shown. | PASS |

The impossible-query literal was changed with user approval from a phrase made of common indexed Chinese terms to the sentinel `龘靐齉xyz987`. Earlier on 2026-08-28, the same browser acceptance session recorded the sentinel against the unchanged production build: it returned zero options and rendered `没有找到任何文档`.

## Interaction and boundaries

- Mouse, keyboard selection, Enter navigation, and the platform `mod+k` shortcut passed.
- Desktop, mobile, light-theme, and dark-theme checks passed without overflow or illegible states.
- Search UI and result-page messages rendered in Simplified Chinese from the plugin's `zh-Hans` locale.
- Empty input did not execute a search. Focusing or hovering the input may preload the same-origin static index to reduce first-query latency; this pinned-plugin behavior is accepted.
- The source fallback for `/tego-arch/search/?q=<query>` uses a relative replacement target. The deployed compatibility artifact is synchronized from the real generated results page and uses History API replacement to preserve query/hash at the canonical `/tego-arch/search?q=<query>` route without hard-coding `/tego-arch/`.
- Generated index and observed result URLs retained `/tego-arch/`.
- No external search or Ask AI request appeared in the captured browser parent-tab request trace; the generated client also constrains the index fetch to the site origin.
- Making the copied production search index unavailable left article content and ordinary navigation usable. Search remained unavailable, and no custom failure UI was added because the plugin does not expose a supported callback for it.
