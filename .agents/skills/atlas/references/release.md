# RELEASE mode — readiness decision and reversible rollout plan

The deliverable is a release-readiness **assessment and runbook**, not a deployment. Start from change scope and target environment; static repo-only scans cannot establish live readiness.

## Gates (mark PASS / FAIL / NOT_VERIFIED / NOT_APPLICABLE with evidence)

1. Change identity: exact commit/image digest/version, delta against currently running version, ownership and target environment.
2. Build and delivery: reproducible artifact, relevant CI/test evidence, artifact provenance, environment parity and deployment mechanism; include compatibility evidence for target OS/architecture, relevant GPU/driver/runtime and dependency lockfiles when applicable.
3. Configuration: required settings, secrets references (never values), environment variables, feature flags, dependency/compatibility changes.
4. Data safety: schema/data migrations, backward/forward compatibility, write-path constraints, migration ordering and likely downtime. Distinguish *application rollback* from *data rollback*; identify operations without safe undo.
5. Availability: traffic management, replicas/capacity where applicable, health/readiness probes, maintenance windows if any, user impact.
6. Observability: measurable key signals, alerts/queries to verify release, telemetry coverage before rollout, operator availability.
7. Recovery: rollback or forward-fix plan; verified restore/backup evidence **when applicable**, realistic recovery conditions and trigger thresholds. Do not assume backup exists or restoration works without proof.
8. Dependencies: downstream/upstream service coordination, API contracts, message schemas, jobs/cron, caches, object storage and external providers.
9. Security handoff: route meaningful vulnerabilities or sensitive-boundary changes to Aegis rather than claiming a security audit was performed.
10. Operational readiness: on-call/contact, runbook, authorization ownership, known issues and unresolved critical risks.

## Decision rule

- `GO`: every applicable **critical** release gate has recent adequate evidence, and no known blocking risk. GO remains a recommendation, not permission to deploy.
- `CONDITIONAL`: no critical unresolved issue, but bounded gaps with explicit conditions, evidence/owner and verification before go-live.
- `NO_GO`: observed unacceptable risk or critical gate failure.
- `INSUFFICIENT_EVIDENCE`: necessary evidence is missing; never turn unknowns into GO.

Use an explicit decision table with gate, result, evidence, impact and required action. If critical gate is unknown, result **cannot be GO**.

## Output `knowledge/operations/releases/YYYY-MM-DD-<slug>/release-plan.md`

- Executive recommendation and exact evidence/limitations.
- Change manifest and environment.
- Gate matrix.
- Proposed dry-run/rehearsal (only as instructions).
- Step-by-step operator runbook: prerequisites, approval authority, checkpoints, pauses, go/no-go, rollback vs forward-fix and owners; **not executed**.
- Observable smoke tests and success/failure conditions. Prefer existing checks and safe non-mutating production observations.
- Aftercare monitoring proposal, verification window defined by user/team not invented.
- Outstanding questions and issue IDs `OPS-###`.

Never issue deployment commands to live infrastructure even if the release verdict is GO.
