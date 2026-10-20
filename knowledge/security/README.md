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
