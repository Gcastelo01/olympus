# Olympus v1.2 — Orchestration and responsibility contract

Olympus begins after external requirements discovery. **Zeus** runs as the root session (Codex: Luna medium; Claude Code: Haiku medium), operating a lightweight control plane; seven specialist skills remain independently model-pinned, with two Atlas profiles. Do not spawn a separate Zeus child from Zeus.

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

The contract above is runtime-independent. Codex and Claude Code differ only in how it is bound: Codex relies on prompt discipline for Zeus's "no implementation" rule, while Claude Code also enforces it with the `zeus` tool allowlist (no file-editing tools, dispatch limited to the eight specialists), removes the Agent tool from specialists and adds a per-role write-scope hook. Neither binding is a sandbox.
