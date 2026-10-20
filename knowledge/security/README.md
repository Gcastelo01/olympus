# Hermes focused security assessment

Current assessment: 2026-10-20-hermes-st02-t02-02; mode REASSESS (SEC-001 only); depth STATIC_PLUS_AUTHORIZED_DYNAMIC. Original focused assessment: 2026-10-20-hermes-st02-t02.
Baseline: `41e7a42ea8aa72fb1f6e3fd830c82168087ab0d0`, branch `feat/hermes-hades`, **dirty working-tree snapshot**, not a reviewed release commit.

The assessed Hermes CLI has bounded checkpoint parsing, restricted path resolution, inert JSON output, exclusive writes and bounded Git subprocesses. The previously confirmed gap in recognizable-credential filtering is **VERIFIED_FIXED** at the reassessed hashes. Seven synthetic credential families were rejected before persistence and on stored-checkpoint reads, without echoing values. No real credential or observed breach was involved. This assessment does not certify the full Olympus project.

- Findings: **0 open**; historical **1 CONFIRMED / MEDIUM**, SEC-001, now VERIFIED_FIXED; zero findings in other severity/evidence categories.
- Coverage: 7 PASS, 0 FAIL, 3 PARTIAL, 2 NOT_TESTED, 1 NOT_APPLICABLE. Only the credential-filter row was reassessed; other results retain their original scope and limits.
- SEC-001/T1 is VERIFIED by Aegis. Independent Argus review and remaining integration validation are separate gates.
- No emergency containment indicated by synthetic local evidence. Keep context text free of credentials; do not share suspected contaminated checkpoints.

Repository visibility was not established. These reports omit complete token-shaped samples, executable reproduction payloads and sensitive project data. Keep any future detailed reproduction bundle restricted; do not publish automatically.

Navigation: [reassessment snapshot](assessments/2026-10-20-hermes-st02-t02-02/report.md), [original snapshot and threat model](assessments/2026-10-20-hermes-st02-t02/report.md), [coverage](coverage.md), [SEC-001](findings/SEC-001.md), [remediation roadmap](roadmap.md).

Residual risk: the scanner recognizes specific patterns and cannot establish that arbitrary prose, unknown credential formats or obfuscated text contain no secrets. Review selected context before handoff. This limitation is not a guarantee of safe automatic disclosure to another provider.

Unverified: live Codex/Claude/Pi handoff, destination model interpretation, Windows/macOS and Node 18; malicious concurrent directory replacement is outside Athena's trusted-worktree contract. No Hades, Graveyard, installer or whole-project security assessment is implied.

## Graveyard ST03-T01 — reassessment 2026-10-20

Current run: `2026-10-20-graveyard-st03-t01-02`, REASSESS of SEC-002/SEC-003 plus registry/CLI regression checks. Dirty working-tree snapshot on `8b881663e24261339728696816d4ffeaeec52a2d`; Linux, Node v24.18.0, Git 2.56.0.

**0 open findings in this scoped assessment.** Historical findings remain CONFIRMED: one HIGH/P1 (SEC-003) and one MEDIUM/P2 (SEC-002), both now VERIFIED_FIXED on the snapshot hashes. There are no new critical/low/informational, probable or needs-validation findings. Prior Hermes findings and scope are unchanged.

Independent safe/unsafe controls verified that replacement refs no longer substitute advertised historical content, and missing promisor blobs/trees do not invoke configured helpers or add objects through the protected commands. Explicit `--no-lazy-fetch` rejects unsupported Git builds instead of silently trusting an ignored environment setting. Native older Git was not executed. The absent registry returns empty list/search/validate results; missing IDs remain errors without registry creation.

Current carried-forward coverage: **10 PASS / 0 FAIL / 3 PARTIAL / 2 NOT_TESTED / 1 NOT_APPLICABLE**. Only GV-02/GV-03 changed to PASS; selected regressions were repeated. Other environments, concurrent malicious ancestor replacement, partial-write faults and exhaustive resource/secret coverage retain their limitations. Repository visibility remains unverified; reports omit executable helper payloads and real credentials.

[Current snapshot](assessments/2026-10-20-graveyard-st03-t01-02/report.md), [original snapshot](assessments/2026-10-20-graveyard-st03-t01/report.md), [SEC-002](findings/SEC-002.md), [SEC-003](findings/SEC-003.md), [coverage](coverage.md), [roadmap](roadmap.md). Argus final review is a separate gate.
