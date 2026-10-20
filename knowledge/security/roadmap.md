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
