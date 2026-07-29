# G007 Batch 5 Organization, Security, and Classification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish PR-15 through PR-17 as the final governed G007 batch, verify the three live pages and their teaching visuals, then close G007 and make G008 the current durable story.

**Architecture:** Add three independent principle MDX pages behind one real-content contract, govern six external identities plus two original Draw.io/SVG assets, and update only the reciprocal relationships supported by the new pages. Deliver with the repository’s two-stage release: Stage A publishes content while the backlog stays pending; Stage B records immutable deployment evidence, closes PR-15 through PR-17, checkpoints G007, and advances the durable story projection to G008.

**Tech Stack:** Docusaurus 3.10.2 MDX, Node.js 24 `node:test`, Bun 1.3.13 repository commands, JSON source ledger and link-health cache, Draw.io + accessible SVG, Mermaid, generated topic/status/source projections, GitHub Pages.

## Global Constraints

- The approved design is `docs/superpowers/specs/2026-07-29-g007-batch5-organization-security-classification-design.md`.
- Scope is exactly PR-15, PR-16, and PR-17. Do not add MOD-01 or any G008 content.
- PR-15 and PR-17 use Draw.io + SVG; PR-16 uses Mermaid. Follow `writing-architecture-cases`, `illustrating-architecture-articles`, and `creating-drawio-architecture-diagrams`.
- Every page uses the exact ten-H2 article contract and exact three-H3 migration sequence from the approved design.
- Every page uses `status: reviewed`, `content_type: principle`, `review_policy: quarterly-version-sensitive`, and the backlog priority: PR-15 `P1`, PR-16/17 `P2`.
- Keep `已证实事实`, `基于证据的推断`, and `个人分析` distinguishable. Label every unsourced micro-scenario `说明性场景`.
- No invented users, incidents, metrics, benchmarks, production experience, first-person narration, or upstream guarantees.
- Use facts summaries only. Do not reproduce source diagrams, tables, code, long quotations, book examples, or protected taxonomies.
- Add no dependencies and do not restructure the content platform.
- Front matter is the canonical relationship input. Run `bun run generate:content`; never hand-edit `src/generated/*.json`.
- Exact reciprocal graph: PR-15 ↔ PR-02/PR-03/PR-08/PR-14; PR-16 ↔ PR-07/PR-09/PR-10; PR-17 ↔ PR-08/PR-14.
- Every new page links `/principles` and one real case: PR-15 → `/cases/micro-frontends-single-spa`; PR-16 → `/cases/litellm-virtual-keys-governance`; PR-17 → `/cases/micro-frontends-single-spa`.
- PR-17 must not create internal CAP or Strangler routes while those target topics are unpublished.
- Register sources before writing factual conclusions. A source is not healthy until a policy-accepted observation is committed.
- New external source identities are exactly:
  - `src-melconway-committees-1968`
  - `src-team-topologies-organization-dynamics-2020`
  - `src-cisa-secure-by-design-2023`
  - `src-nist-sp-800-160-v1r1-2022`
  - `src-gilbert-lynch-cap-2002`
  - `src-fowler-strangler-fig-2024`
- Reuse `src-cheatsheetseries-ea079221bd09` for OWASP threat modeling and `src-larman-applying-uml-patterns-3e-2004` for GRASP.
- New original illustration identities are exactly:
  - `src-atlas-pr15-conway-feedback-loop`
  - `src-atlas-pr17-classification-boundaries`
- Stage A projection is exactly 82 content documents, 457 governed sources, 36 completed topics, durable stories `6 / 20`, current G007.
- Stage B projection is exactly 82 content documents, 457 governed sources, 39 completed topics, durable stories `7 / 20`, current G008, most recently completed G007.
- Batch4 450 + 8 planned identities − 1 NIST canonical identity replacement = 457 unique sources; the user approved this on 2026-07-29 and no ninth source is added.
- Historical review files, deployment tests, backlog evidence, and release counts are immutable.
- Every task receives an independent requirements/content/test review before commit. Resolve findings and rerun its targeted gate.
- Use Bun for ordinary repository scripts. Use `node --test` for nested suites if Bun compatibility is insufficient.

---

## File Structure

### Create

- `tests/g007-batch5-content.test.mjs` — real-repository contract for metadata, article structure, distinctions, misconceptions, visuals, governed sources, relationships, and live-link boundary.
- `content/principles/pr-15-conway-law-team-boundaries.mdx` — descriptive law, reverse Conway intervention, feedback, and reorganization cost.
- `content/principles/pr-16-secure-by-design.mdx` — threat-to-control lifecycle, verification evidence, exceptions, and operational feedback.
- `content/principles/pr-17-classification-boundaries.mdx` — primary-classification criteria and CAP/Strangler/GRASP correction.
- `diagrams/pr-15-conway-feedback-loop.drawio` — editable organization/system feedback diagram.
- `static/img/diagrams/pr-15-conway-feedback-loop.svg` — accessible published PR-15 diagram.
- `diagrams/pr-17-classification-boundaries.drawio` — editable primary-classification/cross-link diagram.
- `static/img/diagrams/pr-17-classification-boundaries.svg` — accessible published PR-17 diagram.
- `tests/g007-batch5-diagrams.test.mjs` — paired-asset, required-label, accessibility, responsive wrapper, and geometry contract.
- `docs/reviews/g007-batch5.md` — independent Stage A review, live evidence, exact SHA/run, and Stage B verdict.
- `tests/g007-batch5-deployment.test.mjs` — immutable deployment and closure regression.

### Modify

- `data/source-ledger.json` — add eight source identities and three governed document entries.
- `data/source-link-health.json` — add reviewed observations for six new HTTPS transports.
- `docs/source-license-inventory.md` — add six external and two original-asset audit rows.
- `content/principles/pr-02-cohesion-coupling.mdx` — reciprocal PR-15 relation.
- `content/principles/pr-03-single-responsibility-separation-of-concerns.mdx` — reciprocal PR-15 relation.
- `content/principles/pr-07-fail-fast-fail-safe-graceful-degradation.mdx` — reciprocal PR-16 relation.
- `content/principles/pr-08-evolutionary-design.mdx` — reciprocal PR-15 and PR-17 relations.
- `content/principles/pr-09-least-privilege-fail-safe-defaults-defense-in-depth.mdx` — reciprocal PR-16 relation.
- `content/principles/pr-10-idempotency-minimal-coordination.mdx` — reciprocal PR-16 relation.
- `content/principles/pr-14-grasp-responsibility-assignment.mdx` — reciprocal PR-15 and PR-17 relations.
- `tests/g007-batch1-content.test.mjs` — accept exact new PR-15 reciprocal fixtures.
- `tests/g007-batch2-content.test.mjs` — accept exact new PR-15/16/17 reciprocal fixtures.
- `tests/g007-batch3-content.test.mjs` — accept exact new PR-16 reciprocal fixtures.
- `tests/g007-batch4-content.test.mjs` — replace unpublished PR-15..17 assertions with published fixtures and exact reciprocal updates.
- `tests/content-review-health.test.mjs` — Stage A 79→82 documents and 450→457 sources.
- `tests/source-ledger-rendering.test.mjs` — 450→457 rendered cards and updated source-kind totals.
- `tests/source-ledger-pagination.test.mjs` — exact tier/source/page totals after eight additions.
- `tests/project-status.test.mjs` — Stage A 36/82/457/G007; Stage B 39/82/457/G008.
- `tests/knowledge-fixtures.test.mjs` — add PR-15 through PR-17 only after Stage B.
- `docs/content-backlog.md` — Stage B only: close PR-15 through PR-17, set `7 / 20`, recently completed G007, current G008.

### Generated by `bun run generate:content`

- `src/generated/case-catalog.json`
- `src/generated/case-series.json`
- `src/generated/pattern-groups.json`
- `src/generated/project-status.json`
- `src/generated/source-ledger.json`
- `src/generated/topic-indexes.json`
- `src/generated/topic-manifest.json`

---

### Task 1: Define the failing Batch 5 content and visual contract

**Files:**

- Create: `tests/g007-batch5-content.test.mjs`
- Create: `tests/g007-batch5-diagrams.test.mjs`
- Test: both files

**Interfaces:**

- Consumes: `readContentDocuments`, `findMarkdownHeadings`, `extractInternalLinks`, `extractExternalLinks`, source ledger JSON, topic manifest JSON, and the Draw.io validator CLI.
- Produces: RED contracts that Tasks 2–6 turn GREEN without weakening assertions.

- [ ] **Step 1: Write the canonical content fixtures**

Create the test with these exact fixtures:

```js
const expected = new Map([
  ['PR-15', ['principles/pr-15-conway-law-team-boundaries.mdx', '/principles/pr-15', 'P1']],
  ['PR-16', ['principles/pr-16-secure-by-design.mdx', '/principles/pr-16', 'P2']],
  ['PR-17', ['principles/pr-17-classification-boundaries.mdx', '/principles/pr-17', 'P2']],
]);

const h2 = [
  '学习问题',
  '一页摘要',
  '事实边界',
  '架构图',
  '控制权与任务流',
  '关键源码导读',
  '架构决策与权衡',
  '生产化分析',
  '可迁移经验',
  '来源',
];

const migrationH3 = [
  '可直接复用的机制',
  '只能有限类比的部分',
  '不应照搬的部分',
];

const relationships = new Map([
  ['PR-15', ['PR-02', 'PR-03', 'PR-08', 'PR-14']],
  ['PR-16', ['PR-07', 'PR-09', 'PR-10']],
  ['PR-17', ['PR-08', 'PR-14']],
]);

const primary = new Map([
  ['PR-15', 'src-melconway-committees-1968'],
  ['PR-16', 'src-cisa-secure-by-design-2023'],
  ['PR-17', 'src-gilbert-lynch-cap-2002'],
]);
```

Assert exact file/slug/priority, `principle`, `reviewed`, `quarterly-version-sensitive`, exact H2/H3 sequences, 4–6 learning questions, one `说明性场景`, the three epistemic labels, at least one evidence card, one parent link, all reciprocal visible links, one real case link, and exactly one `manifest_primary`.

- [ ] **Step 2: Add the decision-boundary assertions**

Use section-scoped regular expressions rather than whole-file slogans:

```js
const decisionContracts = new Map([
  ['PR-15', [
    ['descriptive law', '事实边界', /描述性规律[^。；\n]*(?:不是|不等于)[^。；\n]*规范命令/u],
    ['communication structure', '一页摘要', /沟通结构[^。；\n]*系统设计/u],
    ['reverse Conway condition', '架构决策与权衡', /反向康威[^。；\n]*(?:有条件|干预策略)/u],
    ['reorganization cost', '生产化分析', /团队重组[^。；\n]*(?:成本|代价)/u],
    ['no service-per-team slogan', '生产化分析', /每个服务一个团队[^。；\n]*(?:误用|不成立|并不)/u],
  ]],
  ['PR-16', [
    ['whole lifecycle', '一页摘要', /需求[^。；\n]*设计[^。；\n]*实现[^。；\n]*(?:部署|运营)/u],
    ['threat model inputs', '控制权与任务流', /资产[^。；\n]*攻击者目标[^。；\n]*信任边界[^。；\n]*滥用路径/u],
    ['default deny and least privilege', '架构决策与权衡', /默认拒绝[^。；\n]*最小权限/u],
    ['independent defense layers', '架构决策与权衡', /纵深防御[^。；\n]*(?:独立失效|不同失效)/u],
    ['exception expiry', '生产化分析', /风险接受[^。；\n]*例外期限[^。；\n]*(?:责任所有者|撤销条件)/u],
  ]],
  ['PR-17', [
    ['classification criteria', '一页摘要', /核心问题[^。；\n]*适用尺度[^。；\n]*输入[^。；\n]*输出[^。；\n]*失效条件/u],
    ['CAP home', '架构决策与权衡', /CAP[^。；\n]*分布式(?:系统|理论)/u],
    ['Strangler home', '架构决策与权衡', /Strangler(?: Fig)?[^。；\n]*迁移模式/u],
    ['GRASP home', '架构决策与权衡', /GRASP[^。；\n]*责任分配/u],
    ['primary versus cross-link', '架构图', /主归属[^。；\n]*(?:交叉关系|相关链接)/u],
  ]],
]);
```

Also reject the exact overclaims “组织图就是架构图”, “重组本身会消除耦合”, “通过渗透测试即可关闭设计风险”, “安全团队独自拥有安全”, and any internal `/principles/cap` or `/patterns/strangler` link.

- [ ] **Step 3: Write the paired-diagram contract**

Parameterize both assets:

```js
const diagrams = [
  {
    article: 'content/principles/pr-15-conway-law-team-boundaries.mdx',
    route: '/principles/pr-15',
    drawio: 'diagrams/pr-15-conway-feedback-loop.drawio',
    svg: 'static/img/diagrams/pr-15-conway-feedback-loop.svg',
    labels: ['沟通路径', '团队边界', '系统边界', '交付反馈', '平台能力'],
  },
  {
    article: 'content/principles/pr-17-classification-boundaries.mdx',
    route: '/principles/pr-17',
    drawio: 'diagrams/pr-17-classification-boundaries.drawio',
    svg: 'static/img/diagrams/pr-17-classification-boundaries.svg',
    labels: ['CAP', 'Strangler Fig', 'GRASP', '主归属', '交叉关系'],
  },
];
```

Invoke both exact validators:

```bash
node .codex/skills/creating-drawio-architecture-diagrams/scripts/validate_drawio_svg.mjs \
  diagrams/pr-15-conway-feedback-loop.drawio \
  static/img/diagrams/pr-15-conway-feedback-loop.svg \
  --label "沟通路径" --label "团队边界" --label "系统边界" \
  --label "交付反馈" --label "平台能力"
node .codex/skills/creating-drawio-architecture-diagrams/scripts/validate_drawio_svg.mjs \
  diagrams/pr-17-classification-boundaries.drawio \
  static/img/diagrams/pr-17-classification-boundaries.svg \
  --label "CAP" --label "Strangler Fig" --label "GRASP" \
  --label "主归属" --label "交叉关系"
```

The test must also require an accessible SVG `<title>`, `<desc>`, `role="img"`, `aria-labelledby`, `viewBox`, no fixed root width/height, the exact `.architecture-diagram-scroll` wrapper, purpose-oriented alt text, and the expected local image path.

- [ ] **Step 4: Run RED**

Run:

```bash
node --test tests/g007-batch5-content.test.mjs tests/g007-batch5-diagrams.test.mjs
```

Expected: FAIL only because PR-15 through PR-17 and the two paired diagram assets do not exist.

- [ ] **Step 5: Review and commit**

Review that no assertion depends on source registration or generated drift before the missing pages are introduced. Commit:

```bash
git add tests/g007-batch5-content.test.mjs tests/g007-batch5-diagrams.test.mjs
git commit -m "test: define g007 closing principles contract"
```

---

### Task 2: Govern the six external sources and two original illustrations

**Files:**

- Modify: `data/source-ledger.json`
- Modify: `data/source-link-health.json`
- Modify: `docs/source-license-inventory.md`
- Test: `tests/source-ledger.test.mjs`
- Test: `tests/source-link-health.test.mjs`

**Interfaces:**

- Consumes: existing source schema and checker transports.
- Produces: eight source identities and three document citation sets used by Tasks 3–5.

- [ ] **Step 1: Add the six exact external identities**

Use these canonical locators and factual boundaries:

```json
[
  {
    "id": "src-melconway-committees-1968",
    "canonical_locator": "https://www.melconway.com/research/committees.html",
    "title": "How Do Committees Invent?",
    "author_or_org": "Melvin E. Conway",
    "published_at": "1968-04-01",
    "source_kind": "paper",
    "tier": "primary",
    "usage_boundary": "Supports Conway's original descriptive thesis and communication-path reasoning; it does not prescribe a team topology or prove that reorganization alone changes an existing system."
  },
  {
    "id": "src-team-topologies-organization-dynamics-2020",
    "canonical_locator": "https://teamtopologies.com/s/Organization-Dynamics-with-Team-Topologies-Mini-book-MB80.pdf",
    "title": "Organization Dynamics with Team Topologies",
    "author_or_org": "Matthew Skelton and Manuel Pais / Team Topologies",
    "published_at": "2020-07-01",
    "source_kind": "official-docs",
    "tier": "secondary",
    "usage_boundary": "Supports the Reverse Conway practice, team boundaries, cognitive load, and platform support as organizational design guidance; it is not an empirical guarantee or a universal reorganization template."
  },
  {
    "id": "src-cisa-secure-by-design-2023",
    "canonical_locator": "https://www.cisa.gov/sites/default/files/2023-10/Shifting-the-Balance-of-Cybersecurity-Risk-Principles-and-Approaches-for-Secure-by-Design-Software.pdf",
    "title": "Shifting the Balance of Cybersecurity Risk: Principles and Approaches for Secure by Design Software",
    "author_or_org": "CISA and international partners",
    "published_at": "2023-10-25",
    "source_kind": "official-docs",
    "tier": "primary",
    "usage_boundary": "Supports secure-by-design ownership, secure defaults, lifecycle tactics, and transparency expectations for software manufacturers; it does not prove that any listed tactic eliminates product risk."
  },
  {
    "id": "src-nist-sp-800-160-v1r1-2022",
    "canonical_locator": "https://csrc.nist.gov/pubs/sp/800/160/v1/r1/final",
    "title": "NIST SP 800-160 Vol. 1 Rev. 1: Engineering Trustworthy Secure Systems",
    "author_or_org": "Ron Ross, Mark Winstead, Michael McEvilley / NIST",
    "published_at": "2022-11-16",
    "source_kind": "standard",
    "tier": "primary",
    "usage_boundary": "Supports lifecycle systems security engineering, assurance, validation, verification, and risk treatment; it does not prescribe one software architecture or replace context-specific threat analysis."
  },
  {
    "id": "src-gilbert-lynch-cap-2002",
    "canonical_locator": "https://dl.acm.org/doi/10.1145/564585.564601",
    "title": "Brewer's Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web Services",
    "author_or_org": "Seth Gilbert and Nancy Lynch / ACM",
    "published_at": "2002-06-01",
    "source_kind": "paper",
    "tier": "primary",
    "usage_boundary": "Supports the formal distributed-systems model and its stated consistency, availability, and partition assumptions; it does not support treating CAP as a general design principle or a two-of-three product slogan."
  },
  {
    "id": "src-fowler-strangler-fig-2024",
    "canonical_locator": "https://martinfowler.com/bliki/StranglerFigApplication.html",
    "title": "Strangler Fig",
    "author_or_org": "Martin Fowler",
    "published_at": "2024-08-22",
    "source_kind": "engineering-blog",
    "tier": "primary",
    "usage_boundary": "Supports gradual legacy modernization and transitional coexistence as a migration approach; it does not make Strangler Fig an architecture principle or guarantee a low-cost migration."
  }
]
```

Complete every required ledger field using the existing exact schema. Use conservative all-rights-reserved/facts-summary treatment where no reusable license applies; use NIST/CISA public-document terms only within audited evidence. Do not mark a transport accepted before the live checker observation exists.

- [ ] **Step 2: Add the two original illustration identities**

Use:

```json
[
  {
    "id": "src-atlas-pr15-conway-feedback-loop",
    "canonical_locator": "/img/diagrams/pr-15-conway-feedback-loop.svg",
    "source_kind": "original-illustration",
    "tier": "primary",
    "allowed_evidence_roles": ["illustration"],
    "license": "LicenseRef-Atlas-Original",
    "copyright_policy": "original-atlas",
    "usage_boundary": "Explains the feedback among communication paths, team boundaries, system boundaries, delivery feedback, and platform capability; it does not prove an organizational outcome."
  },
  {
    "id": "src-atlas-pr17-classification-boundaries",
    "canonical_locator": "/img/diagrams/pr-17-classification-boundaries.svg",
    "source_kind": "original-illustration",
    "tier": "primary",
    "allowed_evidence_roles": ["illustration"],
    "license": "LicenseRef-Atlas-Original",
    "copyright_policy": "original-atlas",
    "usage_boundary": "Explains primary classification versus cross-links for CAP, Strangler Fig, and GRASP; it does not establish the source facts represented by those labels."
  }
]
```

- [ ] **Step 3: Add the three governed document entries**

Each entry uses all four copyright checks and exactly one manifest primary:

```json
{
  "content/principles/pr-15-conway-law-team-boundaries.mdx": {
    "reviewed_at": "2026-07-29",
    "copyright_checks": [
      "original-structure",
      "quotation-boundary",
      "attribution-complete",
      "illustration-rights"
    ],
    "citations": [
      {"source_id": "src-melconway-committees-1968", "manifest_primary": true},
      {"source_id": "src-team-topologies-organization-dynamics-2020", "manifest_primary": false},
      {"source_id": "src-atlas-pr15-conway-feedback-loop", "manifest_primary": false}
    ]
  },
  "content/principles/pr-16-secure-by-design.mdx": {
    "reviewed_at": "2026-07-29",
    "copyright_checks": [
      "original-structure",
      "quotation-boundary",
      "attribution-complete",
      "illustration-rights"
    ],
    "citations": [
      {"source_id": "src-cisa-secure-by-design-2023", "manifest_primary": true},
      {"source_id": "src-nist-sp-800-160-v1r1-2022", "manifest_primary": false},
      {"source_id": "src-cheatsheetseries-ea079221bd09", "manifest_primary": false}
    ]
  },
  "content/principles/pr-17-classification-boundaries.mdx": {
    "reviewed_at": "2026-07-29",
    "copyright_checks": [
      "original-structure",
      "quotation-boundary",
      "attribution-complete",
      "illustration-rights"
    ],
    "citations": [
      {"source_id": "src-gilbert-lynch-cap-2002", "manifest_primary": true},
      {"source_id": "src-fowler-strangler-fig-2024", "manifest_primary": false},
      {"source_id": "src-larman-applying-uml-patterns-3e-2004", "manifest_primary": false},
      {"source_id": "src-atlas-pr17-classification-boundaries", "manifest_primary": false}
    ]
  }
}
```

Expand each citation to the exact schema with matching `citation_url`, allowed `roles`, `usage_mode`, attribution, modification note, excerpt, and quotation-review fields. Original illustration citations use `usage_mode: original-illustration`, `roles: ["illustration"]`, and a non-empty creation note.

- [ ] **Step 4: Observe and review live transports**

Run:

```bash
node scripts/source-link-health.mjs --refresh
node scripts/source-link-health.mjs --check-cache
node --test tests/source-ledger.test.mjs tests/source-link-health.test.mjs
```

Expected: six new HTTPS targets have policy-accepted observations; local illustration sources require no HTTP observation; all source and cache tests PASS.

- [ ] **Step 5: Update license inventory, review, and commit**

Add one audited row per new identity. Record copyright status, evidence URL, permitted use, and exclusions. Run:

```bash
node --test tests/source-ledger.test.mjs tests/source-link-health.test.mjs tests/source-license-inventory.test.mjs
git diff --check
```

Commit:

```bash
git add data/source-ledger.json data/source-link-health.json docs/source-license-inventory.md
git commit -m "content: govern g007 closing principle sources"
```

---

### Task 3: Publish PR-15 with the organization/system feedback diagram

**Files:**

- Create: `content/principles/pr-15-conway-law-team-boundaries.mdx`
- Create: `diagrams/pr-15-conway-feedback-loop.drawio`
- Create: `static/img/diagrams/pr-15-conway-feedback-loop.svg`
- Test: `tests/g007-batch5-content.test.mjs`
- Test: `tests/g007-batch5-diagrams.test.mjs`

**Interfaces:**

- Consumes: PR-15 ledger citations and Draw.io geometry contract.
- Produces: published PR-15 content and synchronized diagram pair used by Task 6 reciprocal updates.

- [ ] **Step 1: Write PR-15 front matter and learning contract**

Use:

```yaml
title: Conway 定律与团队边界
slug: /principles/pr-15
content_type: principle
status: reviewed
analyzed_at: 2026-07-29
source_cutoff: 2026-07-29
review_policy: quarterly-version-sensitive
difficulty: advanced
confidence: high
domains:
  - software-architecture
quality_attributes:
  - maintainability
  - modifiability
  - deployability
tags:
  - Conway 定律
  - 团队边界
  - 反向康威
topic_id: PR-15
priority: P1
depends_on:
  - PR-02
adjacent_topics:
  - PR-02
  - PR-03
  - PR-08
  - PR-14
related_cases:
  - /cases/micro-frontends-single-spa
related_questions: []
```

Write 4–6 learning questions covering descriptive law, communication paths, reverse Conway, migration cost, and re-evaluation.

- [ ] **Step 2: Write the visible narrative and evidence cards**

Use the exact ten H2 and three migration H3 headings. The visible path must preserve:

- communication structure as a constraint, not an exact deterministic copy;
- reverse Conway as an intervention hypothesis with observable delivery/ownership feedback;
- architecture, platform, management, and affected teams as distinct decision owners;
- reorganization, duplicate ownership, capability gaps, and migration-period coordination cost;
- the boundary that architectural evidence alone does not authorize personnel decisions.

Use evidence cards only for the 1968 publication details, exact Team Topologies work/version, and source scope.

- [ ] **Step 3: Create synchronized Draw.io and SVG semantics**

Use a 1200-unit viewBox rendered at 800 CSS px. The primary left-to-right reading path is:

```text
沟通路径 → 团队边界 → 系统边界 → 交付反馈
                  ↑         ↓
                  └─ 平台能力 ┘
```

The Draw.io and SVG must both contain the exact required labels. Use plain-text `mxCell.value`; SVG must have visible `<text>` labels, `<title>`, `<desc>`, `role="img"`, and `aria-labelledby`. Keep body/edge text ≥15 rendered CSS px, role text ≥10 px, node padding ≥16/14 px, title/type baseline gap ≥22 px, bottom clearance ≥14 px, edge-label-to-stroke ≥8 px, edge-label-to-arrow ≥16 px, and edge-label-to-node ≥12 px.

- [ ] **Step 4: Embed and validate**

Embed:

```mdx
<div
  className="architecture-diagram-scroll"
  role="region"
  aria-label="Conway 组织与系统反馈图，可横向滚动"
  tabIndex={0}
>

![沟通路径、团队边界、系统边界、平台能力与交付反馈之间的循环关系](/img/diagrams/pr-15-conway-feedback-loop.svg)

</div>
```

Run the validator with all five labels, then:

```bash
node --test tests/g007-batch5-content.test.mjs tests/g007-batch5-diagrams.test.mjs
node .codex/skills/writing-architecture-cases/scripts/analyze_case_density.mjs content/principles/pr-15-conway-law-team-boundaries.mdx
```

Expected: PR-15 tests PASS; PR-16/17 remain RED; PR-15 visual balance >90.

- [ ] **Step 5: Review and commit**

Review fact integrity, narrative continuity, evidence-layer integrity, density/AI patterns, diagram semantics, and forbidden implications. Commit:

```bash
git add content/principles/pr-15-conway-law-team-boundaries.mdx \
  diagrams/pr-15-conway-feedback-loop.drawio \
  static/img/diagrams/pr-15-conway-feedback-loop.svg
git commit -m "content: add conway team boundary principle"
```

---

### Task 4: Publish PR-16 as a secure-design lifecycle

**Files:**

- Create: `content/principles/pr-16-secure-by-design.mdx`
- Test: `tests/g007-batch5-content.test.mjs`

**Interfaces:**

- Consumes: CISA, NIST, and OWASP governed citations.
- Produces: PR-16 content and Mermaid lifecycle used by Task 6 reciprocal updates.

- [ ] **Step 1: Write PR-16 front matter**

Use:

```yaml
title: Secure by Design
slug: /principles/pr-16
content_type: principle
status: reviewed
analyzed_at: 2026-07-29
source_cutoff: 2026-07-29
review_policy: quarterly-version-sensitive
difficulty: advanced
confidence: high
domains:
  - software-architecture
  - security
quality_attributes:
  - security
  - privacy
  - resilience
tags:
  - Secure by Design
  - 威胁建模
  - 安全验证
topic_id: PR-16
priority: P2
depends_on:
  - PR-09
adjacent_topics:
  - PR-07
  - PR-09
  - PR-10
related_cases:
  - /cases/litellm-virtual-keys-governance
related_questions: []
```

- [ ] **Step 2: Write the lifecycle narrative**

The exact flow is:

```mermaid
flowchart LR
  A["资产与信任边界"] --> T["威胁与滥用路径"]
  T --> C["控制与安全需求"]
  C --> V["实现与验证证据"]
  V --> O["运行检测与例外"]
  O --> R["风险再评估"]
  R --> A
```

The visible narrative must explain that PR-09 supplies component controls while PR-16 supplies lifecycle integration. It must cover default deny, least privilege, independent defense layers, design/static/dynamic/dependency/config/runtime verification, risk acceptance owner, expiry, revocation, and recovery.

- [ ] **Step 3: Add evidence cards and misconception controls**

Use separate evidence cards for CISA’s software-manufacturer scope, NIST’s lifecycle engineering scope, and OWASP’s threat-model workflow. Keep in visible prose:

- security is shared by product, architecture, engineering, operations, and security specialists;
- penetration testing is evidence for some attack paths, not closure of design risk;
- encryption is one control, not the definition of secure design;
- exceptions are expiring decisions with owners and withdrawal conditions.

- [ ] **Step 4: Validate, review, and commit**

Run:

```bash
node --test tests/g007-batch5-content.test.mjs
node .codex/skills/writing-architecture-cases/scripts/analyze_case_density.mjs content/principles/pr-16-secure-by-design.mdx
```

Expected: PR-15/16 content assertions PASS; PR-17 remains RED; PR-16 visual balance >90.

Commit:

```bash
git add content/principles/pr-16-secure-by-design.mdx
git commit -m "content: add secure by design principle"
```

---

### Task 5: Publish PR-17 with primary classification and cross-links

**Files:**

- Create: `content/principles/pr-17-classification-boundaries.mdx`
- Create: `diagrams/pr-17-classification-boundaries.drawio`
- Create: `static/img/diagrams/pr-17-classification-boundaries.svg`
- Test: `tests/g007-batch5-content.test.mjs`
- Test: `tests/g007-batch5-diagrams.test.mjs`

**Interfaces:**

- Consumes: CAP, Strangler Fig, GRASP, and original-illustration citations.
- Produces: PR-17 content and synchronized classification diagram pair.

- [ ] **Step 1: Write PR-17 front matter**

Use:

```yaml
title: 分类边界与纠错
slug: /principles/pr-17
content_type: principle
status: reviewed
analyzed_at: 2026-07-29
source_cutoff: 2026-07-29
review_policy: quarterly-version-sensitive
difficulty: intermediate
confidence: high
domains:
  - software-architecture
quality_attributes:
  - maintainability
  - learnability
tags:
  - 分类
  - CAP
  - Strangler Fig
  - GRASP
topic_id: PR-17
priority: P2
depends_on:
  - PR-14
adjacent_topics:
  - PR-08
  - PR-14
related_cases:
  - /cases/micro-frontends-single-spa
related_questions: []
```

- [ ] **Step 2: Write the classification decision table**

The page must compare:

| Topic | Core question | Scale | Input | Output | Primary home |
| --- | --- | --- | --- | --- | --- |
| CAP | What guarantees are feasible under the stated network model? | Distributed system | Consistency, availability, partition assumptions | Feasibility/trade-off boundary | Distributed-systems theory |
| Strangler Fig | How can legacy capability be replaced incrementally? | System migration | Outcomes, seams, coexistence, cutover evidence | Migration sequence and transitional architecture | Migration pattern |
| GRASP | Who should own an object-design responsibility? | Object/module collaboration | Information, creation, coordination, variation | Responsibility assignment | Responsibility-assignment method |

Follow the table with the decision: a topic may cross-link to principles, but its primary home follows its main question and output.

- [ ] **Step 3: Create and embed the paired diagram**

Use three horizontal source nodes and three primary-home regions. Solid labeled arrows mean `主归属`; thin dashed arrows mean `交叉关系`. Required labels occur in both files: `CAP`, `Strangler Fig`, `GRASP`, `主归属`, `交叉关系`.

Use the same 1200→800 scale and geometry thresholds as Task 3. Embed:

```mdx
<div
  className="architecture-diagram-scroll"
  role="region"
  aria-label="架构主题主归属与交叉关系图，可横向滚动"
  tabIndex={0}
>

![CAP、Strangler Fig 与 GRASP 的主归属及交叉关系](/img/diagrams/pr-17-classification-boundaries.svg)

</div>
```

- [ ] **Step 4: Enforce no-dead-route and anti-taxonomy boundaries**

The page may name planned categories in prose, but it must not link unpublished routes. It must state that taxonomy is revisable and that one primary home does not erase cross-domain relationships. It must not claim the three topics are unrelated to architecture principles.

- [ ] **Step 5: Validate, review, and commit**

Run the Draw.io validator with all five labels, then:

```bash
node --test tests/g007-batch5-content.test.mjs tests/g007-batch5-diagrams.test.mjs
node .codex/skills/writing-architecture-cases/scripts/analyze_case_density.mjs content/principles/pr-17-classification-boundaries.mdx
```

Expected: all Batch 5 content and diagram assertions PASS; PR-17 visual balance >90.

Commit:

```bash
git add content/principles/pr-17-classification-boundaries.mdx \
  diagrams/pr-17-classification-boundaries.drawio \
  static/img/diagrams/pr-17-classification-boundaries.svg
git commit -m "content: add architecture classification boundaries"
```

---

### Task 6: Restore reciprocal relationships and generate Stage A projections

**Files:**

- Modify: the seven existing principle pages listed in File Structure.
- Modify: historical G007 content tests only for exact relationship/publication expectations.
- Modify: aggregate count tests listed in File Structure.
- Modify: generated JSON projections.
- Test: all G007 and generation suites.

**Interfaces:**

- Consumes: final new-page `adjacent_topics`.
- Produces: one reciprocal, visible relationship graph and Stage A generated state.

- [ ] **Step 1: Update front matter in stable numeric order**

Apply exactly:

```js
const reciprocalAdditions = new Map([
  ['PR-02', ['PR-15']],
  ['PR-03', ['PR-15']],
  ['PR-07', ['PR-16']],
  ['PR-08', ['PR-15', 'PR-17']],
  ['PR-09', ['PR-16']],
  ['PR-10', ['PR-16']],
  ['PR-14', ['PR-15', 'PR-17']],
]);
```

Insert each new ID into the existing numeric/topic order. Do not remove or reorder unrelated relationships.

- [ ] **Step 2: Add visible reciprocal prose**

Each modified page’s `相邻原则` section must link and explain the relationship. Keep one sentence per new neighbor:

- PR-02/03: team communication and responsibility boundaries influence change propagation.
- PR-08: PR-15 covers organizational migration; PR-17 prevents migration patterns from being misfiled as principles.
- PR-14: PR-15 scales responsibility to teams; PR-17 establishes GRASP’s primary category.
- PR-07/09/10: PR-16 integrates failure containment, secure defaults/least privilege, and retry/side-effect boundaries into lifecycle security.

- [ ] **Step 3: Update historical fixture expectations without rewriting evidence**

Historical tests may change only:

- exact `adjacent_topics` arrays affected by the additions;
- PR-15..17 unpublished assertions to published assertions where necessary;
- route maps needed for the new reciprocal links.

Do not edit old review files, old Stage A SHA/run literals, old counts recorded as historical facts, or old deployment test conclusions.

- [ ] **Step 4: Generate and lock Stage A counts**

Run:

```bash
bun run generate:content
```

Update real-repository expectations to:

```js
{
  durable_stories: {completed: 6, total: 20, current: 'G007'},
  completed_topics: 36,
  content_documents: 82,
  governed_sources: 457,
}
```

Update source rendering/pagination totals by deriving the exact primary/secondary and source-kind counts from `data/source-ledger.json`; assert the resulting exact integers and total uniqueness, not only the grand total.

- [ ] **Step 5: Run Stage A verification**

Run:

```bash
node --test \
  tests/g007-batch1-content.test.mjs \
  tests/g007-batch2-content.test.mjs \
  tests/g007-batch3-content.test.mjs \
  tests/g007-batch4-content.test.mjs \
  tests/g007-batch5-content.test.mjs \
  tests/g007-batch5-diagrams.test.mjs \
  tests/project-status.test.mjs \
  tests/content-platform-generation.test.mjs \
  tests/content-review-health.test.mjs \
  tests/source-ledger-rendering.test.mjs \
  tests/source-ledger-pagination.test.mjs
bun run check:content
```

Expected: all targeted tests PASS and generated files are deterministic.

- [ ] **Step 6: Review and commit**

Review exact reciprocal symmetry, visible links, no dead PR-17 category route, and no historical evidence changes. Commit:

```bash
git add content/principles tests src/generated
git commit -m "content: connect g007 closing principles"
```

---

### Task 7: Complete four-gate editorial and local browser verification

**Files:**

- Modify: only files with confirmed review defects.
- Test: full repository.

**Interfaces:**

- Consumes: completed Stage A candidate.
- Produces: reviewed local Stage A SHA candidate with measured visual evidence.

- [ ] **Step 1: Run the four article review gates in order**

For each page, record PASS/FAIL for:

1. fact integrity;
2. narrative continuity;
3. evidence-layer integrity;
4. density and AI-pattern pass.

Run:

```bash
node .codex/skills/writing-architecture-cases/scripts/analyze_case_density.mjs \
  content/principles/pr-15-conway-law-team-boundaries.mdx \
  content/principles/pr-16-secure-by-design.mdx \
  content/principles/pr-17-classification-boundaries.mdx
```

Resolve `missing-visual-content`, `low-visual-balance`, `missing-illustrative-label`, empty/unanchored evidence cards, duplicate summaries/labels, and unsupported density warnings. Every page must score strictly greater than 90.

- [ ] **Step 2: Run deterministic asset and repository gates**

Run:

```bash
node --test tests/drawio-diagram-validator.test.mjs tests/g007-batch5-diagrams.test.mjs
npm run verify
git diff --check
git status --short
```

Expected: all commands PASS; only intended tracked changes exist.

- [ ] **Step 3: Build and serve production locally**

Run:

```bash
npm run build
npm run serve -- --host 127.0.0.1 --port 3100
```

Check:

- `http://127.0.0.1:3100/tego-arch/principles/pr-15`
- `http://127.0.0.1:3100/tego-arch/principles/pr-16`
- `http://127.0.0.1:3100/tego-arch/principles/pr-17`

at desktop `1440x1000` and mobile `390x844`.

- [ ] **Step 4: Measure Draw.io pages**

For PR-15 and PR-17 require:

```text
desktop image.getBoundingClientRect().width === 800
mobile wrapper.scrollWidth > wrapper.clientWidth
mobile document.documentElement.scrollWidth === document.documentElement.clientWidth
```

Record the 800/viewBox render scale, every measured node’s title/type baselines and ≥22 px gap, ≥14 px bottom clearance, ≥8 px label/stroke clearance, ≥16 px label/arrow clearance, and ≥12 px label/node clearance. Focus the wrapper, verify visible focus, keyboard horizontal scrolling, and changed `scrollLeft`.

For all three pages require HTTP 200, nonzero visual dimensions, readable labels, no cropped connectors, no document overflow, 0 console warnings, 0 console errors, visible governed source labels, and real parent/adjacent/case clicks.

- [ ] **Step 5: Independent review and candidate commit**

Have an independent reviewer check the approved spec, Tasks 1–7 diff, tests, visual measurements, source boundaries, and article gates. Resolve every Critical/Important/Minor finding and rerun targeted/full verification.

If review fixes were needed, commit them:

```bash
git add content diagrams static data docs tests src
git commit -m "content: address g007 closing batch review"
```

If no fixes were needed, do not create an empty commit.

---

### Task 8: Publish and verify Stage A

**Files:**

- No planned content changes after the accepted Stage A commit.

**Interfaces:**

- Consumes: clean reviewed Stage A candidate.
- Produces: exact deployed Stage A SHA/run and measured production evidence.

- [ ] **Step 1: Capture and merge the exact candidate**

Run:

```bash
git status --short
git rev-parse HEAD
```

Require a clean worktree. Fast-forward or merge the reviewed feature branch to `main` using the repository’s established release procedure, then push `main`. Capture the literal 40-character head SHA from `git rev-parse HEAD`.

- [ ] **Step 2: Gate the exact Pages run**

Find the GitHub Pages run whose `headSha` equals the captured Stage A SHA. Require:

```text
status=completed
conclusion=success
```

Reject a successful run for any other SHA. Record the literal run ID and inspect build/deploy annotations.

- [ ] **Step 3: Verify production**

Require HTTP 200 for `/principles`, `/principles/pr-15`, `/principles/pr-16`, and `/principles/pr-17`. Repeat the desktop/mobile, console, overflow, diagram geometry, focus/scroll, source visibility, and click matrix checks against `https://sealday.github.io/tego-arch`.

Expected click matrix:

```text
PR-15 6/6 = parent 1 + adjacent 4 + case 1
PR-16 5/5 = parent 1 + adjacent 3 + case 1
PR-17 4/4 = parent 1 + adjacent 2 + case 1
15/15 total
```

- [ ] **Step 4: Preserve Stage A evidence without closing backlog**

Do not check PR-15 through PR-17 yet. Retain the exact SHA, run ID, production asset URLs, viewport measurements, source labels, click counts, test total, 82/457/36 counts, and independent review identity for Task 9.

---

### Task 9: Record immutable evidence and close G007 in Stage B

**Files:**

- Create: `docs/reviews/g007-batch5.md`
- Create: `tests/g007-batch5-deployment.test.mjs`
- Modify: `docs/content-backlog.md`
- Modify: `tests/project-status.test.mjs`
- Modify: `tests/knowledge-fixtures.test.mjs`
- Modify: generated JSON projections.

**Interfaces:**

- Consumes: literal Stage A SHA, Pages run, production observations, and test totals.
- Produces: immutable Stage B closure and G008 current projection.

- [ ] **Step 1: Write the deployment regression first**

The test parses exactly one line matching each anchored form:

```text
^Exact Stage A SHA: `[0-9a-f]{40}`$
^GitHub Pages run: \[`[0-9]+`\]\(https://github\.com/sealday/tego-arch/actions/runs/[0-9]+\)$
^Exact run gate: `headSha=[0-9a-f]{40}`, `status=completed`, `conclusion=success`\.$
```

It must require:

- the parsed run ID is identical in the label and URL, and the parsed SHA is identical in the SHA and run-gate lines;
- the commit resolves with `git cat-file -e "${stage_a_sha}^{commit}"`;
- literal `82 content documents`, `457 governed sources`, and `36 completed topics` Stage A evidence;
- full repository test total copied from the accepted Stage A run;
- desktop/mobile, 0 warnings/errors, no document overflow, local contained overflow, 800 px diagram width, keyboard scroll/focus, and 15/15 clicks;
- visible labels for all eight governed identities;
- Stage B `39 completed topics`, `7 / 20`, recently completed G007, current G008;
- `Stage B closure — PASS`;
- mutation tests reject duplicate/contradictory SHA/run, altered counts, missing source labels, and weakened runtime evidence.

Run RED:

```bash
node --test tests/g007-batch5-deployment.test.mjs
```

Expected: FAIL because the review and closure state do not yet exist.

- [ ] **Step 2: Write `docs/reviews/g007-batch5.md`**

Use literal captured values, never symbolic placeholders. Include separate PR-15/16/17 Editorial, Fact, Copyright, Representation, and Anti-overclaim sections. Include Draw.io geometry measurements, PR-16 Mermaid containment, production asset URLs, exact click matrix, source visibility, exact Stage A counts/test total, independent review verdict, and `Stage B closure — PASS`.

- [ ] **Step 3: Close exactly three backlog rows and advance the durable story**

Change only PR-15/16/17 from `[ ]` to `[x]`, each with the same literal Stage A SHA, run URL, and canonical live route. Change:

```md
- **持久故事进度：** 已完成 `7 / 20`；最近完成 `G007`。
- **当前持久故事：** `G008`。
```

Do not edit historical evidence rows.

- [ ] **Step 4: Regenerate and update Stage B fixtures**

Run:

```bash
bun run generate:content
```

Require:

```js
{
  durable_stories: {completed: 7, total: 20, current: 'G008'},
  completed_topics: 39,
  content_documents: 82,
  governed_sources: 457,
}
```

Add PR-15/16/17 to `tests/knowledge-fixtures.test.mjs` with exact files and `complete: true`.

- [ ] **Step 5: Verify, review, and commit Stage B**

Run:

```bash
node --test tests/g007-batch5-deployment.test.mjs tests/project-status.test.mjs tests/knowledge-fixtures.test.mjs
npm run verify
git diff --check
```

Obtain an independent Stage B review for immutable evidence, exact closure scope, generated state, and historical-evidence preservation. Resolve findings.

Commit:

```bash
git add docs/reviews/g007-batch5.md docs/content-backlog.md \
  tests/g007-batch5-deployment.test.mjs tests/project-status.test.mjs \
  tests/knowledge-fixtures.test.mjs src/generated
git commit -m "docs: close g007 architecture principles"
```

---

### Task 10: Publish Stage B and finish the branch

**Files:**

- No planned content changes after accepted Stage B commit.

**Interfaces:**

- Consumes: clean reviewed Stage B commit.
- Produces: synchronized branch/main/origin, successful final deployment, and durable G007 completion evidence.

- [ ] **Step 1: Merge and push Stage B**

Use the established non-destructive release path. Require local `main`, `origin/main`, and `codex/g007-principles-batch5` to resolve to the same Stage B SHA. Push the retained feature branch.

- [ ] **Step 2: Verify the exact final Pages run**

Require the Pages run for the exact Stage B SHA to be `completed/success`, with build and deploy annotations free of errors. Do not reuse the Stage A run for this gate.

- [ ] **Step 3: Run final production smoke**

Require HTTP 200 for:

```text
/principles
/principles/pr-15
/principles/pr-16
/principles/pr-17
```

Confirm production index shows PR-15 through PR-17 as published, generated status reports G008 current and 7/20, and all three pages still pass visible source, diagram, Mermaid, click, console, and overflow smoke checks.

- [ ] **Step 4: Final repository proof**

Run:

```bash
git status --short
git rev-parse main
git rev-parse origin/main
git rev-parse codex/g007-principles-batch5
npm run verify
```

Expected: clean worktrees, identical SHAs, and full verification PASS. Report the exact Stage A SHA/run, Stage B SHA/run, final test total, 82 documents, 457 sources, 39 completed topics, G007 complete, and G008 current.
