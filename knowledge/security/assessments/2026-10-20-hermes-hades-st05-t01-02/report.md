# ST05-T01 — independent security reassessment

- Run: `2026-10-20-hermes-hades-st05-t01-02`; 2026-10-20 UTC.
- Mode: REASSESS, limited to SEC-001/T2, SEC-003/T2 and SEC-004/T1 plus related regression checks.
- Baseline: `ec44ae815c0d869b111e463745cd1312df6cc1d0`, branch `feat/hermes-hades`, **dirty working-tree snapshot**. Exact source/test/profile hashes and actual probe results: [evidence.json](evidence.json).
- Depth: STATIC_PLUS_AUTHORIZED_DYNAMIC, Linux/Node v24.18.0/Git 2.56.0. No production or authenticated provider activity; all probes use synthetic local repositories.
- Security gate: **PASS for these three corrective tasks at these hashes**. SEC-001, SEC-003 and SEC-004 are **VERIFIED_FIXED**. Argus final implementation review remains a separate gate.

There are **0 OPEN findings** in this reassessment and no new actionable findings. Historical evidence status remains CONFIRMED: one HIGH/P1 (SEC-003), two MEDIUM/P2 (SEC-001/SEC-004), all VERIFIED_FIXED. SEC-002 remains at its previous VERIFIED_FIXED status; it was not reopened. No findings in other severity/evidence categories. This is not whole-project security certification.

## Inspected repairs

`src/context.mjs` now screens the final serialized checkpoint with `assertNoSensitiveContent` before `ensureContextDirectory` and exclusive persistence. Both Hermes Git helpers now pass explicit `--no-lazy-fetch`, suppress replacement objects and lazy fetch in their reduced environments, and retain the existing bounded subprocess behavior. `src/graveyard.mjs` now checks the candidate with lstat before opening; uses O_NONBLOCK/O_NOFOLLOW where available; validates the opened descriptor; and retains the 64 KiB bounded read. The zero fallback for unavailable platform flags does not establish native Windows behavior or protection against hostile concurrent directory replacement.

## Independent evidence actually executed

1. **Original metadata path:** saved a normal checkpoint, changed to a synthetic recognizable credential-shaped branch, then attempted a new save. Save rejected with the generic sensitive-content error; no credential echo; the previous checkpoint bytes remained identical and no new checkpoint appeared. In a fresh repository on the synthetic branch, rejection occurred before `.olympus` existed. Ordinary branch save succeeded. No real secret was read, persisted or printed in these probes.
2. **Original FIFO path plus callers:** a FIFO/no-writer registry record was passed to inspect, list, validate, exhume, export and Hermes retired-reference hints. A Python subprocess supervisor enforced a real three-second deadline. All calls completed together in **45 ms**, returning rejected/INVALID entries; list's aggregate status remained OK with an INVALID record, consistent with its current API. No `.olympus` export/state was created. Unlike the implementer's sandbox-limited supervisor attempt, this independent supervised probe executed successfully.
3. **Original missing-tree/promisor path:** after configuring a local-only benign upload helper and removing the fixture's HEAD tree, `observeGit` and save returned unavailable. Lightweight identity/root/discovery calls returned without accessing that tree. Across all protected calls: **no helper marker, no file changes anywhere in the fixture snapshot, no object additions, no config/index mutation and no managed state**. An unprotected local Git cat-file positive control then invoked the same helper, proving the fixture still reaches the formerly unsafe transport path. No network target was contacted.
4. **Replacement refs:** added a local replacement commit with different ancestry; `observeGitIdentity` retained the original project ID/history anchor. The fixture did not rely on source modifications.
5. **Unsupported-Git simulation:** a temporary Git executable rejected the explicit no-lazy-fetch option. `observeGit`, `observeGitIdentity` and `findProjectRoot` all rejected; three guarded calls were observed and no fallback without the guard occurred. This is a simulation of unsupported-option handling, not execution of a native older Git version.
6. **Regression:** `node --test test/state-primitives.test.mjs test/context.test.mjs test/graveyard.test.mjs test/hades-fixtures.test.mjs test/st04-installation.test.mjs` exited 0. Runner reported five file-level tests, five pass, zero fail. `/tmp/aegis-st05-reassess-tests.log` contains ephemeral output. `git diff --check` exited 0. The supplied tests supplement, rather than replace, the independent probes.

The probe source and results remain under `/tmp/aegis-st05-reassess.py`, `/tmp/aegis-st05-reassess-results.json` and `/tmp/aegis-st05-oldgit-results.json`; they are not package artifacts. This report records redacted outcomes and source hashes, without executable helper payloads or credential-shaped data. Repository visibility remains unestablished; no publishing action was performed.

## Coverage and references

Reassessed controls: F09, F10 and F11 are now PASS. Carried-forward aggregate: **11 PASS / 0 FAIL / 4 PARTIAL / 2 NOT_TESTED / 1 NOT_APPLICABLE**. The other 15 controls retain their original [ST05 scope and limits](../2026-10-20-hermes-hades-st05-t01/report.md#coverage-matrix); this run does not silently recertify them.

| Control | Status | Current evidence |
|---|---|---|
| F09 — Hermes observation cannot trigger implicit fetch | PASS | Original local helper probe, fixture snapshot equality, positive unsafe control, replacement-ref and unsupported-option checks. |
| F10 — Registry special files cannot block before validation | PASS | Source precheck/nonblocking descriptor validation and supervised FIFO probes across all relevant callers. |
| F11 — Final generated checkpoint content is screened | PASS | Sensitive metadata rejected before directory/write; normal save succeeds; existing checkpoint unchanged. |

Reference meanings are unchanged from the same-day original assessment: [CWE-312, CWE 4.20](https://cwe.mitre.org/data/definitions/312.html), [CWE-829](https://cwe.mitre.org/data/definitions/829.html), broad availability category [CWE-400](https://cwe.mitre.org/data/definitions/400.html), and [Git no-lazy-fetch/no-replace-objects](https://git-scm.com/docs/git). Official pages were checked during the original assessment on the same date. No additional compliance claim or ASVS level is assigned.

## Residual limits and handoff

Native Node 18, Windows/macOS, native older Git, authenticated Codex/Claude/Pi first-turn behavior and actual provider/model enforcement remain **NOT_VERIFIED**. The secret filter remains heuristic. Unknown/obfuscated credentials, concurrent hostile filesystem replacement, exhaustive cumulative resource limits and partial-write faults are not proven safe. The no-lazy-fetch option intentionally fails closed on unsupported Git rather than silently weakening the boundary. A finite Linux probe cannot establish every platform's special-file behavior.

The three tasks require no additional corrective work on the assessed hashes. Preserve current checks and exact review scope; proceed to Argus for the final delivered diff and the already authorized commit/PR workflow through Zeus and Hephaestus. Any material subsequent change to these boundaries requires review of that delta.
