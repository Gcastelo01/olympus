# Hermes security remediation roadmap

Baseline: 2026-10-20 dirty snapshot based on `41e7a42ea8aa72fb1f6e3fd830c82168087ab0d0`. This does not replace Moirai's implementation plan or Argus's verdict.

## P1 — Correct recognizable-secret filtering

### SEC-001/T1

- Status: VERIFIED
- Verification: independent Aegis [reassessment 2026-10-20-hermes-st02-t02-02](assessments/2026-10-20-hermes-st02-t02-02/report.md), on the exact source/test hashes recorded there. Argus remains a separate implementation gate.
- Finding/control: [SEC-001](findings/SEC-001.md), recognizable credentials before persistence/output.
- Owner: Hephaestus; prerequisites: Zeus acceptance of the scoped task. No new architectural decision needed.
- Scope: shared scanner in `src/state-primitives.mjs`, focused tests in existing primitives/context tests, task evidence. Preserve unrelated changes.
- Invariant: known GitHub token families and explicit bearer authorization values cannot pass into checkpoint storage or context output; rejection diagnostics omit values.
- Acceptance: the negative and positive cases in SEC-001 pass, including escaped JSON strings, artifact content and existing stored checkpoints; no added dependencies; existing context lifecycle tests stay green.
- Boundaries: do not implement an exhaustive DLP service, query external credential APIs or rewrite all checkpoints automatically.
- Rollback: ordinary reviewable source revert if needed; never restore a contaminated fixture into project state.
- Gates: Hephaestus evidence → Aegis REASSESS SEC-001 → Argus independent implementation review. Implementation alone leaves the finding FIX_PENDING_VERIFICATION.

## P2 — Preserve validation gaps in release evidence

### HERMES-VALIDATE-01

- Status: PENDING
- Prerequisites: final implementation and available supported runtimes/platforms.
- Scope: record platform and live handoff evidence in normal release tasks; see [coverage](coverage.md).
- Acceptance: actual supported-platform runs and authenticated handoff tests, or explicit NOT_VERIFIED with executable follow-up steps. Do not count mocks as live integrations.
- Owner: normal Olympus validation flow; no application changes implied by this task.
- Rollback: none; evidence-only work.

No P0 task is indicated. Concurrent hostile OS-user directory replacement remains outside the accepted architecture rather than being presented as a confirmed exploitable defect.

## Graveyard ST03-T01 — 2026-10-20

### SEC-003/T1 — Prevent implicit fetch and configured process execution

- Priority: P1; Status: VERIFIED; finding: [SEC-003](findings/SEC-003.md).
- Owner: Hephaestus; prerequisite: accepted Athena observation-only/no-fetch invariant and supported Git floor decision if needed.
- Scope: Graveyard Git wrapper and focused regression fixtures; inspect any shared wrapper used on the same command path. Do not change user Git configuration, fetch objects, widen permissions or repair application code.
- Invariant: missing local object cannot trigger remote transport, configured helper execution or object-store writes. Enforce supported no-lazy-fetch behavior consistently; unsupported Git must fail safely.
- Acceptance: local promisor fixtures with missing blob/tree/history, benign process marker absent, inspect/exhume/export unavailable without fetch or output leaks, normal local history and environment/fsmonitor regressions pass. Version compatibility documented.
- Verification: Aegis repeats the original marker probe on new hashes; Argus reviews exact final diff.
- Rollback: revert the isolated repair only during development; do not release the vulnerable observation path. No data migration.

### SEC-002/T1 — Bind recovered content to actual Git objects

- Priority: P2; Status: VERIFIED; finding: [SEC-002](findings/SEC-002.md).
- Owner: Hephaestus; prerequisite: accepted Athena provenance contract; independent of SEC-003/T1 except shared wrapper edits.
- Scope: all Graveyard graph/tree/blob subprocesses and focused fixture tests.
- Invariant: local replacement refs cannot substitute history/content under advertised object IDs. Ignore replacements consistently without deleting them; unsupported/missing history remains unavailable.
- Acceptance: blob and commit replacements cannot falsify descriptor provenance, both JSON and export receipt correspond to true historical bytes, replacement refs/application remain untouched, ordinary rewritten histories still work.
- Verification: Aegis repeats replacement-object probe; Argus checks final diff. No design expansion required for the narrow control.
- Rollback: revert isolated code during development; no migration or object mutation.

No P0 containment action is indicated by local synthetic evidence. Other platform, concurrency and fault-injection gaps remain explicitly untested, not open confirmed vulnerabilities.

### Reassessment completion — 2026-10-20-graveyard-st03-t01-02

SEC-003/T1 and SEC-002/T1 are VERIFIED by Aegis on [recorded hashes](assessments/2026-10-20-graveyard-st03-t01-02/report.md). Safe/unsafe blob/tree and replacement controls passed; final Graveyard suite passed. No new P0/P1 remediation task remains from this focused scope. Native older Git and other platform/fault-injection gaps remain untested, as listed in coverage. Do not infer final Argus approval or full-project certification.
