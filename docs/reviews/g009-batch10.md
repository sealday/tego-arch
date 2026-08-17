# G009 Batch 10 Stage A Review

## Stage A projection

- Projection: `61 completed topics / 105 content documents / 544 governed sources`.
- STY-09: `published / pending`.
- STY-10: `unpublished / pending / non-actionable`; actionable route count: `0`.
- This record is a local Stage A candidate only. It does not close the backlog and does not authorize deployment.

## Artifact identities

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `content/styles/sty-09-pipes-and-filters.mdx` | 20,209 | `1dcf55ace2a6b8f30da94e81d36d9f79a16db400bc419c35318cc8dbe8eba7b6` |
| `diagrams/sty-09-pipes-filters-order-processing.drawio` | 70,558 | `36da252d3fe71b1f0c3df6db5a887677b83def7ee11f542f938c9d3027fbf97c` |
| `static/img/diagrams/sty-09-pipes-filters-order-processing.svg` | 25,205 | `1568fc09dbb6637d54e66d0058d9479cbf2e59d990753489781a119a06fb1a29` |
| `data/source-ledger.json` | 1,599,660 | `cc94104f499f07400785118fb791efed66d9d4588f7b3ba9de160eb031e29a7f` |

- Governed STY-09 sources: `5`; remote anchors per state: `4`; original diagram rights remain governed separately.
- Exactly one STY-09 citation is `manifest_primary`.

## Immutable immediate history

- Complete immediate STY-08 review SHA-256: `f7d0aba59dd69d6479bbfbdb6f9f3cf1befadcf076c44ff5f97f31d6452778ed`.
- Complete immediate STY-08 backlog suffix SHA-256: `3a8d6ccda815614132a33ca8ec2c0dca286628c20900d9e32a4403f0ffd56c6b`.
- The backlog is unchanged: STY-09 remains unchecked for Stage A and STY-10 remains unchecked, unpublished, pending and non-actionable.

## Generated projection audit

- `npm run generate:content` and `npm run check:content`: `PASS`.
- Generated line delta: `360 insertions / 46 deletions` across four current projection files.

| Generated artifact | Before bytes | Candidate bytes | Byte delta | Line delta |
| --- | ---: | ---: | ---: | ---: |
| `src/generated/project-status.json` | 415 | 415 | 0 | `+2 / -2` |
| `src/generated/source-ledger.json` | 1,855,594 | 1,871,834 | +16,240 | `+286 / -0` |
| `src/generated/topic-indexes.json` | 221,023 | 221,389 | +366 | `+36 / -22` |
| `src/generated/topic-manifest.json` | 220,869 | 221,235 | +366 | `+36 / -22` |

- The five new unique governed identities are `src-microsoft-pipes-filters-pattern`, `src-apache-beam-programming-guide`, `src-reactive-streams-1-0-4`, `src-gnu-bash-pipelines`, and `src-atlas-sty09-pipes-filters-order-processing`.
- The first full Node run correctly exposed `66` current projection, pagination, corpus inventory, reciprocal adjacency, prose seam, rights-inventory and current schema-registry fixtures. No historical review/raw/Pages/backlog evidence literal was changed.
- Current-facing fixture synchronization and reciprocal prose seam repair are complete; the final pre-candidate full Node suite is `1260/1260 PASS`.

## Local in-app Browser QA

- Status: `PENDING`; collection has not run.

## Independent review checkpoint

- Exact implementation candidate head: `PENDING`.
- Exact evidence head: `PENDING`.
- Independent code/spec/security review: `PENDING`.
- Independent content/evidence/rights review: `PENDING`.
- Independent architecture/invariant review: `PENDING`.
- Final Stage A review judgment: `PENDING`.
- Scope boundary: `STAGE_A_ONLY`; Stage B backlog closure and deployment have not run.
- Deployment status: `NOT_RUN`.
