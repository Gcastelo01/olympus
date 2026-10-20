# Current security gate — ST05 corrective reassessment

2026-10-20; `ec44ae815c0d869b111e463745cd1312df6cc1d0`, **dirty corrected working-tree snapshot**, STATIC_PLUS_AUTHORIZED_DYNAMIC. **PASS for SEC-001/T2, SEC-003/T2 and SEC-004/T1 at the recorded hashes**. All three findings are VERIFIED_FIXED; **0 open findings** in this reassessment. Historical CONFIRMED severity: 1 HIGH and 2 MEDIUM, now fixed. No new finding in any evidence/severity category. SEC-002 remains previously VERIFIED_FIXED.

Independent probes verified rejection of sensitive generated metadata before persistence, no Git helper/object/config/index/state side effects, and prompt supervised FIFO rejection. Supplied five test files pass. Carried-forward coverage: **11 PASS / 0 FAIL / 4 PARTIAL / 2 NOT_TESTED / 1 NOT_APPLICABLE**; only F09–F11 were reassessed. Native platform/version matrix, live harness/provider enforcement and exhaustive secret/resource guarantees remain unverified. Argus final review remains separate.

[Current snapshot and exact hashes](assessments/2026-10-20-hermes-hades-st05-t01-02/report.md), [coverage](coverage.md), [roadmap](roadmap.md). No source fixes, commits or publication were performed by Aegis.

---

# Historical focused gate — ST05-T01 initial findings

2026-10-20; `ec44ae815c0d869b111e463745cd1312df6cc1d0`, **dirty working-tree snapshot**, STATIC_PLUS_AUTHORIZED_DYNAMIC. **CHANGES_REQUIRED:** 3 CONFIRMED/OPEN findings (1 HIGH/P1: SEC-003; 2 MEDIUM/P2: SEC-001 and SEC-004). No findings in other evidence/severity categories. SEC-001 and SEC-003 are reopened for newly verified paths; previous scoped fixes and reports remain historical evidence. SEC-002 remains VERIFIED_FIXED in its Graveyard scope.

Current selected coverage: **8 PASS / 3 FAIL / 4 PARTIAL / 2 NOT_TESTED / 1 NOT_APPLICABLE**. Supplied five test files pass; independent probes expose generated-metadata secret persistence, Hermes implicit Git fetch-helper execution, and a blocking nonregular Graveyard read. Implement SEC-003/T2 first, then SEC-001/T2 and SEC-004/T1; Aegis reassessment and Argus final review remain required. No production exposure or real secret was observed, and no emergency containment is inferred.

[ST05 snapshot and evidence](assessments/2026-10-20-hermes-hades-st05-t01/report.md), [coverage](coverage.md), [roadmap](roadmap.md). Live harness/provider behavior, native platform/version matrix, concurrent hostile filesystem mutation and exhaustive secret/resource coverage remain unverified. Reports are redacted because visibility is unknown; no automatic publication by Aegis.

---

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

## Hermes–Graveyard ST03-T02 — focused delta assessment

2026-10-20, dirty snapshot on `7b1965f07c9d8b2b59ea165dbc0e42e72c1cd679`. No new actionable finding established (zero across severity/evidence categories). Bounded untrusted hints preserve stale evidence, reconciliation and read-only behavior. Independent boundary probes and both test files passed.

Coverage: **5 PASS / 0 FAIL / 2 PARTIAL / 1 NOT_TESTED / 0 NOT_APPLICABLE**. Live model prompt handling, worst-case history latency and other platforms remain unverified. This delta does not recertify prior components. [Report and exact hashes](assessments/2026-10-20-hermes-graveyard-st03-t02/report.md). Continue to Argus; no new security remediation task.

## ST04-T01 profiles/bootstrap — 2026-10-20

Focused dirty snapshot on `ec44ae815c0d869b111e463745cd1312df6cc1d0`: no new actionable security finding established (zero across severity/evidence categories). Structural profile/pin/generator validation, temporary project/fake-home installation, conflict/symlink probes and package-content checks passed. No authenticated runtime was exercised.

Coverage: **4 PASS / 0 FAIL / 3 PARTIAL / 1 NOT_TESTED / 0 NOT_APPLICABLE**. Pi enforcement/model selection, live bootstrap and global-only skill resolution remain unverified. The user-scope nested relative skill path is functional coverage pending, not a confirmed security finding. [Report, exact hashes and handoff](assessments/2026-10-20-hades-hermes-st04-t01/report.md). Continue to Argus and honest final runtime evidence.
