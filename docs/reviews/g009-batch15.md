# G009 Batch 15 — STY-14 Architecture Style Choice Matrix Review

## Stage A candidate

- Scope: `STAGE_A_ONLY`.
- STY-14 lifecycle: `published / pending`.
- STY-15 lifecycle: `absent / unpublished / pending / non-actionable`.
- Projection: `84 completed topics / 127 content documents / 600 governed sources`.
- Code/spec/security review: `PENDING`.
- Content/evidence/rights review: `PENDING`.
- Architecture/invariant review: `PENDING`.
- Final Stage A judgment: `PENDING`.
- Deployment status: `NOT_RUN`.

## Local Browser evidence

- Raw Browser artifact: `docs/reviews/evidence/g009-batch15-stage-a-browser.json`; bytes `32300`; SHA-256 `b27cf34181529dfbcaf6eccd533d65fd0db5f8552b1dd08def0fbd95150c4609`.
- Browser build input identity: `286 files / 76c94055d82ab1460f1a6f93f21245b3e4adf1bd11ac9f21b57535fe2091d610`; base head `463f1dec2ae0b35eedcf6fef2933f11ad60d74f8`; working-tree candidate, not a deployed head.
- Input identity correction: added previously omitted `sidebars.ts`; its bytes are unchanged between the base head, observed-candidate commit `eb723b4de6c5d9ef27072d6dbf797c9e7fe13156`, and this correction. No new Browser observations were performed; original capture time, measurements and screenshot limitations remain unchanged.
- Functional observations: `4/4 states`; `12/12 wrapper checks`; `12/12 relation href/H1/return checks`; `24/24 source anchors`; STY-15 actionable total `0`; console warnings/errors and complete CDP diagnostics empty.
- Screenshot evidence: `BLOCKED / NOT_ACCEPTED`; attempts `4/4`; accepted `0/4`; viewport images were inspected in tool output, but no durable full-article screenshot artifact was retained.
- Collection boundary: Codex in-app Browser / CUA only; actual Tab/Right keyboard input with DOM focus; exact-href relation navigation plus Browser back, not physical clicks; source destinations are resolved anchors, not remote-page probes. Preliminary tab/log-scope observations remain disclosed in raw collection notes.
