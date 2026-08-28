# G009 Batch 14 Stage A Review

## Stage A projection

- Projection: `65 completed topics / 109 content documents / 573 governed sources`.
- STY-13: `published / pending`.
- STY-14: `unpublished / pending / non-actionable`; actionable route count: `0`.
- Exact clean implementation head: `9bbc779b146453a70a7aea7d6e3da2edddefc6fe`.
- This is a factual Stage A evidence candidate only. It does not close the backlog, claim deployment, or supply any independent verdict.

## Artifact identities

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `content/styles/sty-13-space-based-architecture.mdx` | 20,605 | `89569481e650bd5f8a0845fb3b3943e16b1c8faebdfd18be27afc00013751b03` |
| `data/source-ledger.json` | 1,681,848 | `422b0ad4e4c128618203157864efb6d16dad7059ba97567a7f8dbdf8e87bd085` |
| `diagrams/sty-13-space-based-flight-availability.drawio` | 22,184 | `cff8f280c882f0fab92004b7104f42c7fb79440e3390d7b7aa077f4205c62aeb` |
| `static/img/diagrams/sty-13-space-based-flight-availability.svg` | 26,671 | `68e15b5fe4eefd49f5870c672e125d0fa9e001b5177049d43a09d68d2deb56d7` |
| `docs/reviews/evidence/g009-batch14-stage-a-browser.json` | 42,484 | `aaa0dfcc61f3717676bd5a108cad7cfa2e5fe51baa63a5fff9ce05954b074b6b` |

- Governed STY-13 sources: `8`; remote anchors per state: `7`; original diagram rights remain governed separately.
- The Browser-observed SVG PageAssets bundle is an exact byte match for the reviewed SVG.

## Immutable immediate history

- Complete immediate Batch 13 review SHA-256: `688c800ecafcfc3ed66529e2896d49fd247680412f9eba6c5a25da357e8ae44c`.
- Complete immediate Batch 13 local raw SHA-256: `a0de2d5ea069b2af87ad4aa4ef4696a9a22e6ff99ba96b616763262f1814ed38`.
- Complete immediate Batch 13 Stage A production raw SHA-256: `a28bb3269f2b7545b7d77f2ec506ce5b1bd737924a5db6945481ee8ec5763560`.
- Complete immediate Batch 13 Stage B production raw SHA-256: `93540ff26f5d7a6fddb2ca5310a838304d04afa6994788fcf1fb8d0b4a6ff958`.
- Complete immediate Batch 13 release-baseline SHA-256: `52c9fe9aa36e1ab9c406162c1d34f489ee439058f73f450e973fe496b35902f0`.
- The validator freezes the complete review, all three raw artifacts, and the complete `40,108`-byte current release-baseline suffix; no historical literal is weakened.

## Local in-app Browser QA

- Exact local URL: `http://127.0.0.1:4173/tego-arch/styles/sty-13`.
- Raw Browser JSON: `docs/reviews/evidence/g009-batch14-stage-a-browser.json`; bytes: `42,484`; SHA-256: `aaa0dfcc61f3717676bd5a108cad7cfa2e5fe51baa63a5fff9ce05954b074b6b`.
- Browser surface: `Codex in-app Browser only`; fallback used: `false`.
- Functional Browser QA: `PASS`; states `4/4`; wrapper interactions `16/16`; relation href/H1/return observations `16/16`; source href/target/rel observations `28/28`.
- STY-14 actionable count: `0` per state.
- Diagnostics: `57/57` deliberately paged preparation, interaction, destination, return, screenshot and terminal pages; every accepted page has `count=0`, `hasMore=false`, `truncated=false`; terminal cursor `477 -> 477`.
- Screenshot evidence: `PASS / ACCEPTED`; accepted `4/4`; captures faithfully cover the production-analysis table viewport, not the opening or full page.

| State | Bytes | SHA-256 | Judgment |
| --- | ---: | --- | --- |
| `desktopLight` | 149,450 | `13402199be913a432d0088655ee0089f51ed188759359a77d1c5ca8e78009bad` | `CAPTURED_ACCEPTED` |
| `desktopDark` | 152,042 | `260c79f24d33d8bdf8f35dbb9c275d076e8a781fea8fe6dbfffc64f83efbc68b` | `CAPTURED_ACCEPTED` |
| `mobileLight` | 49,347 | `1b1ee1ccade33baefa9810e90a1ea8b14c1c15371be05cdf0160153770b368ed` | `CAPTURED_ACCEPTED` |
| `mobileDark` | 49,094 | `270cb5b450ca39fd354755b047e4f0d3e89eab70aac8947286a00fe9f35c41e0` | `CAPTURED_ACCEPTED` |

- Fresh exact-X collection begins at diagnostic cursor `13`; no stale pre-remediation screenshot or substituted Browser evidence is present in the accepted raw.
- Exact preparation cursor spans are desktop light `13 -> 26`, desktop dark `122 -> 134`, mobile light `230 -> 258`, and mobile dark `354 -> 381`; every preparation page has zero Runtime/Log events and no truncation.

## Independent review checkpoint

- Exact reviewed candidate head: `UNBOUND — controller must create and bind the exact post-evidence candidate head`.
- Independent code/spec/security review: `UNBOUND — controller must assign a read-only reviewer`.
- Independent content/evidence/rights review: `UNBOUND — controller must assign a different read-only reviewer`.
- Independent architecture/invariant review: `UNBOUND — controller must assign a third read-only reviewer`.
- Review finding totals: `UNBOUND`.
- Final Stage A review judgment: `NOT_RECORDED`.
- Scope boundary: `STAGE_A_ONLY`.
- Deployment status at this checkpoint: `NOT_RUN`.

No independent verdict is recorded in advance. The controller must bind all three reviews to the same exact candidate head and may record the final judgment only after each review reports its own findings.

## Review requests

### Code / spec / security

Read-only scope: exact-schema validators at every nested object and array; mutation sensitivity; exact implementation/head binding; complete Batch 13 review/raw/backlog identity; unique-writer and split-brain stop contracts; substituted-browser, fabricated-deployment, diagnostic-pagination and screenshot-overclaim rejection.

### Content / evidence / rights

Read-only scope: fact, vendor-case, evidence-based inference and original-analysis boundaries; seven remote source identities and summary limits; eight governed identities; original Draw.io/SVG rights; screenshot scope and the rejected pre-session attempt.

### Architecture / invariant

Read-only scope: stable affinity key; partition-local operation boundary; unique real-time authority; external durable workflow; hotspot and rebalance controls; primary epoch and split-brain stop behavior; checkpoint/log recovery; explicit non-use conditions.
