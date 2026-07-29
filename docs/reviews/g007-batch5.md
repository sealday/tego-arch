# G007 Batch 5 independent review and deployment closure

Exact Stage A SHA: `2169c3a0f09fc9edbe4589ea657d1383eeecf758`
GitHub Pages run: [`30445404784`](https://github.com/sealday/tego-arch/actions/runs/30445404784)
Exact run gate: `headSha=2169c3a0f09fc9edbe4589ea657d1383eeecf758`, `status=completed`, `conclusion=success`.

## Release gate

- Independent reviewer: `/root/final_review_g007_batch3_stagea`.
- Independent verdict: `CLEAN`, `0 remaining issues`, `APPROVE`.
- Repository test gate: `487/487` tests passed.
- Stage A projection: `82 content documents`, `457 governed sources`, `36 completed topics`.
- Stage B projection: `39 completed topics`, durable story `7 / 20`, recently completed G007, current G008.
- Pages build job `90554402356` and deploy job `90554630321` both completed successfully; both annotation collections were empty.
- Canonical routes `/principles`, `/principles/pr-15`, `/principles/pr-16`, and `/principles/pr-17` returned HTTP 200.
- Browser matrix covered desktop `1440x1000` and mobile `390x844`, with `0 warnings / 0 errors`, no document overflow, contained overflow for wide diagrams or Mermaid, keyboard scroll/focus evidence for both focusable SVG wrappers, and `15/15 total` real link clicks.

## PR-15 — Conway 定律与团队边界

### Editorial

The page starts with the conflict between communication structure and independently evolving capabilities, frames Conway's law as a descriptive lens, and keeps the conditional reverse-Conway intervention, decision ownership, migration cost, and recovery feedback in the visible narrative. The independent editorial gate reported density score 100 with no warnings.

### Fact

The page distinguishes source fact from site inference. `How Do Committees Invent?` supports the 1968 descriptive proposition; `Organization Dynamics with Team Topologies` supports the bounded organization-dynamics discussion. Neither source is used to claim that an organization chart deterministically produces a service topology or that reorganization alone changes an existing system.

### Copyright

The page paraphrases the two external works, links to their canonical public locations, and does not reproduce protected long-form text. The illustration is a repository-authored asset governed as `src-atlas-pr15-conway-feedback-loop`.

### Representation

- Production asset: `https://sealday.github.io/tego-arch/img/diagrams/pr-15-conway-feedback-loop.svg` (`image/svg+xml`, HTTP 200).
- Original illustration label/alt: `沟通路径、团队边界、系统边界、平台能力与交付反馈之间的循环关系`.
- Desktop: the diagram renders at `800 x 413.328125` inside an `800/800` wrapper; all five relationship labels are visible: `约束协作`, `塑造边界`, `产生反馈`, `提出支撑需求`, and `降低认知负荷`.
- At the 800 px rendering scale, the minimum measured clearances are 15.33 px from glyph to stroke, 43.45 px from glyph to arrow marker, and 12 px from glyph to node. No label background erases a connector.
- Mobile: the document remains `390=390`; the diagram remains 800 px wide inside a `358/800` local scroll wrapper. The focus outline is solid 3 px with 4 px offset; local horizontal scroll changed `0 -> 180`. The unchanged current wrapper/CSS also retained the prior keyboard scroll/focus measurement `0 -> 114`.
- Source visibility: Mel Conway and Team Topologies links plus the original illustration alt/src were visible in the rendered page.
- Click matrix: `6/6 = parent 1 + adjacent 4 + case 1`.

### Anti-overclaim

The page explicitly says the arrows are hypotheses to inspect, not causal guarantees; architecture evidence cannot authorize personnel decisions; "one team per service" is rejected; and an intervention must be reconsidered when ownership, handoff, platform-support, or delivery feedback does not improve.

## PR-16 — Secure by Design

### Editorial

The page connects threat inputs, default-deny controls, least privilege, independent layers, exception ownership, expiry, revocation, recovery, and feedback as one lifecycle. Product, architecture, engineering, operations, and risk-owner handoffs remain readable without expanding evidence cards.

### Fact

The rendered source identities include `CISA Secure by Design`, `NIST SP 800-160 Vol. 1 Rev. 1`, and `OWASP Threat Modeling Cheat Sheet`. The page uses them for secure-by-design responsibility, systems-security engineering lifecycle, and threat-modeling practice respectively; it does not claim that one checklist or threat model proves the resulting system secure.

### Copyright

External guidance is summarized and linked. No protected diagram or long passage is copied. The lifecycle Mermaid is an original explanatory rendering of this page's bounded synthesis.

### Representation

- Desktop: document `1440=1440`; Mermaid wrapper `800/800`; SVG `800 x 66.34375`.
- Mobile: document `390=390`; Mermaid wrapper `358/672`; SVG `672 x 55.734375`. The diagram uses contained overflow without producing document-level overflow.
- Source visibility: CISA PDF, NIST publication page, and OWASP cheat sheet labels and URLs were visible.
- Console: `0 warnings / 0 errors`.
- Click matrix: `5/5 = parent 1 + adjacent 3 + case 1`.

### Anti-overclaim

The page says security is a lifecycle responsibility rather than a release-stage gate, treats exceptions as explicit and revocable, and states that the linked LiteLLM case does not prove complete implementation of the lifecycle.

## PR-17 — 分类边界与纠错

### Editorial

The page explains why a navigation category is not an ontological identity, assigns CAP, Strangler Fig, and GRASP to primary homes, preserves cross-reading, and makes correction triggers and ownership visible. The classification remains a revisable retrieval aid rather than a universal taxonomy.

### Fact

The rendered evidence includes `Brewer's Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web Services`, `Strangler Fig`, and `Applying UML and Patterns, 3rd Edition`. CAP is treated as distributed-systems theory, Strangler Fig as a migration pattern, and GRASP as a responsibility-assignment method.

### Copyright

The three external works are paraphrased with canonical links. The original classification diagram is governed as `src-atlas-pr17-classification-boundaries`; it does not reproduce a third-party figure.

### Representation

- Production asset: `https://sealday.github.io/tego-arch/img/diagrams/pr-17-classification-boundaries.svg` (`image/svg+xml`, HTTP 200).
- Original illustration label/alt: `CAP、Strangler Fig 与 GRASP 的分类边界、主归属及交叉关系`.
- Desktop: diagram wrapper `800/800`; SVG `800 x 506.6640625`.
- The three `主归属` labels have 13.33 px minimum stroke clearance, 20.67 px marker clearance, and 28 px destination-node clearance. The solid/dashed legend remains separated from the nearest dashed relation by at least 74.67 px.
- Mobile: document `390=390`; focusable diagram wrapper `358/800`; focus outline solid 3 px with 4 px offset; local horizontal scroll changed `0 -> 180`.
- Source visibility: CAP DOI, Fowler, Larman/Pearson, and the original illustration alt/src were visible.
- Console: `0 warnings / 0 errors`.
- Click matrix: `4/4 = parent 1 + adjacent 2 + case 1`.

### Anti-overclaim

The page states that classification does not transfer decision authority, cross-links do not change primary ownership, and a real case link does not prove that any migration path is universally applicable.

## Production evidence summary

- `https://sealday.github.io/tego-arch/principles`
- `https://sealday.github.io/tego-arch/principles/pr-15`
- `https://sealday.github.io/tego-arch/principles/pr-16`
- `https://sealday.github.io/tego-arch/principles/pr-17`
- All four routes returned HTTP 200.
- PR-15 `6/6`, PR-16 `5/5`, PR-17 `4/4`; `15/15 total`.
- All eight new governed identity labels were visible: `How Do Committees Invent?`, `Organization Dynamics with Team Topologies`, `CISA Secure by Design`, `NIST SP 800-160 Vol. 1 Rev. 1`, `Brewer's Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web Services`, `Strangler Fig`, `沟通路径、团队边界、系统边界、平台能力与交付反馈之间的循环关系`, and `CAP、Strangler Fig 与 GRASP 的分类边界、主归属及交叉关系`.

Stage B closure — PASS
