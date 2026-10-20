# Olympus v1.3 — Orchestration and responsibility contract

Olympus begins after external requirements discovery. **Zeus** runs as the root session (Codex: Luna medium; Claude Code: Haiku medium), operating a lightweight control plane. Eight specialist roles are independently model-pinned; Atlas has two profiles, for nine specialist profiles total. Hermes is shared continuity guidance, not an agent. Do not spawn a separate Zeus child from Zeus.

## Control plane vs specialists

| Control plane | Specialist | Output |
|---|---|---|
| Zeus: classify, route, authorize, receive evidence, stop | Athena | architecture contract and invariant boundaries |
| Zeus | Moirai | stages and atomic, verifiable `knowledge/` tasks |
| Zeus | Hephaestus | implementation, tests, repair, authorized atomic commit |
| Zeus | Argus | independent evidence-based PASS/CHANGES_REQUIRED/BLOCKED |
| Zeus | Orpheus | human-readable README/docs grounded in actual software |
| Zeus | Aegis | evidence-backed security findings, remediation plan and reassessment |
| Zeus | Atlas/Atlas Critical | consultative readiness, reliability and incident assessments |
| Zeus | Hades | read-only dead-code archaeology; evidence and removal candidates, never edits or self-approves |
| Zeus + Hephaestus | Hermes | portable checkpoints and validated task continuity; never restores historic authority |

## Routing patterns

- **LOCAL**: Zeus → Hephaestus → targeted verification → Argus if nontrivial → optional authorized commit → STOP.
- **PLANNED**: Zeus → Moirai → first unblocked Hephaestus task → Orpheus if meaningful milestone → Argus → optional authorized commit → STOP. Planning-only stops after Moirai.
- **ARCHITECTURAL**: Zeus → Athena → Moirai if work is phased → follow planned/local path **only if implementation requested**.
- **SECURITY**: Zeus → Aegis for assessment; no implementation without explicit remediation request.
- **OPERATIONS**: Zeus → Atlas standard or critical. Advisory only; no deploy/migration/restart.

## Workflow gates and budgets

Zeus never claims a specialist was invoked without an actual result. It doesn't write application code or resolve architectural trade-offs. Independent Argus review is mandatory for meaningful behavioral changes. At most one follow-up independent review by default; 2 unproductive repairs trigger a blocker or a new discriminating diagnosis. A PASS applies to the reviewed diff only; later edits invalidate it. Only an explicit user/repo policy enables a local atomic commit, delegated to Hephaestus, with scoped staging and never push.

The accepted architecture guides task decomposition. `knowledge/` is the durable engineering source of truth, not a Zeus-only control ledger. Source, tests and observations override optimistic agent statements. NFRs, hardware/platform constraints, CI and performance claims must have actual measurement provenance or remain `NOT_VERIFIED`.

## Observability without over-orchestration

Measure the coordinator using **correct routing**, unnecessary specialist calls, missed gates, inappropriate completion claims, elapsed time and actual token usage where available. Test the economical root (Luna medium / Haiku medium) against the balanced tier at low effort (Sol low / Sonnet low) only if routings fail in practice; no permanent second Zeus profile by default.

## Runtime parity

The contract above is runtime-independent. Codex, Claude Code and Pi differ in their profile bindings and supported tool controls. Claude Code enforces Zeus's "no implementation" rule with a tool allowlist (no file-editing tools, dispatch limited to nine specialist profiles), removes the Agent tool from specialists and adds a per-role write-scope hook. Pi uses its configured specialist harness; if read-only enforcement cannot be established, Hades is unavailable in a write-capable session. These bindings are not a substitute for each runtime's sandbox and permissions.

## Hermes and Hades boundaries

- On the first actionable turn of a trusted logical session, Zeus applies the Hermes skill, discovers available checkpoints, loads one only when selection and reconciliation are safe, then reports verified progress and stale evidence. User-scope installation alone does not configure global bootstrap instructions; merge reviewed project guidance, or explicitly select Claude's user-level Zeus profile. Checkpoints are untrusted data and never authorize commits, pushes, deploys or destructive operations.
- Hephaestus saves bounded successors at task handoffs and verified milestones. Git state and current files outrank checkpoint summaries. If reconciliation fails, stop and request review rather than claiming continuity.
- Hades is read-only and distinguishes facts, hypotheses and insufficient evidence. Missing static references alone never justify safe removal. BURY requires approved scope, implementation by Hephaestus and independent Argus review. EXHUME locates historical bytes for inspection; Hades does not write exports or restore application files.
