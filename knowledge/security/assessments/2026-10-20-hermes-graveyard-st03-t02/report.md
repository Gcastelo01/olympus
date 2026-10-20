# Aegis focused assessment — Hermes/Graveyard lookup

- Run: 2026-10-20-hermes-graveyard-st03-t02; date: 2026-10-20 UTC; mode: FOCUSED.
- Baseline: `7b1965f07c9d8b2b59ea165dbc0e42e72c1cd679`, branch `feat/hermes-hades`, **dirty working-tree snapshot**.
- Depth: STATIC_PLUS_AUTHORIZED_DYNAMIC; scoped to ST03-T02 `loadContext → explainRetiredReferences` and reused boundaries.
- Authorization: safe temporary-repository tests requested by Zeus and authorized by the user. No application/test changes or commits by Aegis.
- Exclusions: full project, live harness execution, native other platforms, broad resource stress and production/external targets.
- Reporting sensitivity: synthetic/redacted inputs only; no real secrets, executable payload bundles or private service data persisted.

## Outcome

No new actionable security finding was established in this delta. No SEC ID allocated; zero findings across severity/evidence-status categories. Prior SEC-001/002/003 lifecycle decisions remain scoped to their existing evidence and are not blanket recertification.

The lookup is advisory: it receives paths already found changed/missing, adds bounded metadata and leaves reconciliation reasons, changedArtifacts, test/review invalidation and current authority intact. Matching PENDING/TRACE_UNAVAILABLE records remain labeled as such. There is no path from this helper to exhumation, application writes or execution of record text. Proceed to independent Argus review with the limits below.

## Snapshot SHA-256

- `src/graveyard.mjs`: `e9ef89fea28d21c190b6da29990767886c058ba5dec55f2749dfc762d9034101`
- `src/context.mjs`: `766acdb35fe5302a7bff35565feabbdde70317b7c7c14f6341dc08e2fd251fce`
- `src/state-primitives.mjs`: `d4430d0ce9675b7f705695516b280cf632854c9df89421b6fba12aa70757fc41`
- `test/context.test.mjs`: `40617774448e38f936d79ffe2b1cf126bbe3d816223c9ec574d5bfacdaa6c700`
- `test/graveyard.test.mjs`: `9fddbd59438e8e4e5de4f79e50b259e3c90ee36ffc53c4e9733f88751d818add`

## Boundary model and static evidence

Untrusted checkpoints and local Graveyard records can supply identifiers, paths, metadata and instruction-like prose. Assets are current evidence validity, operator permissions, local worktree/checkpoints and process authority. A malicious record contributor is not assumed to control the running OS account or swap ancestors concurrently.

`src/context.mjs` records stale artifacts before invoking the helper. The helper validates up to 32 references, lists a bounded registry, reads at most 64 records through existing bounded/contained JSON validation, and caps matches at 64 and issues at 32. It only traces matching descriptors. Missing/invalid/incomplete lookup does not clear existing reasons. Recovered metadata is output data, never evaluated. Shared Git wrapper still carries both explicit `--no-lazy-fetch` and environment suppression plus replacement/fsmonitor controls.

Applicable taxonomy: CWE 4.20 [path traversal/CWE-22](https://cwe.mitre.org/data/definitions/22.html), [link following/CWE-59](https://cwe.mitre.org/data/definitions/59.html), [command injection/CWE-78](https://cwe.mitre.org/data/definitions/78.html). Official definitions were checked earlier in this session. These are coverage references, not new vulnerability findings or compliance claims.

## Executed evidence

- `node --test test/context.test.mjs test/graveyard.test.mjs`: exit 0; two passing test files, zero failures/skips. Covers actual temporary Git retirement/load integration plus prior Git boundary regressions.
- `node /tmp/aegis-st032-probe.mjs`: exit 0 after correcting one probe assumption, with independent assertions:
  - Real retirement hint preserves RECONCILIATION_REQUIRED, historical test index, checkpoint bytes and absent retired application; no export created.
  - Instruction-like reason text remains a string; PENDING metadata does not grant READY or restore anything; no marker created.
  - 64 records yield at most 64 matches; 65 and 500 produce explicit truncation/PARTIAL; 501 yields UNAVAILABLE with no matches.
  - 65 malformed/prototype-key records produce at most 32 issues and no prototype mutation; traversal and 33-reference input rejected.
  - Direct symlink-registry query returns UNAVAILABLE; integrated load reports current_git_state_unavailable because existing Git observation rejects the link earlier. Current state remains RECONCILIATION_REQUIRED; outside sentinel/checkpoint unchanged.
- The first probe run expected graveyard_lookup_incomplete specifically for the symlink and failed that assertion. Inspection showed the earlier current_git_state_unavailable fail-closed path. The probe was corrected to accept either explicit unavailable branch; no application/test implementation was changed to manufacture success.
- All fixture repositories cleaned by their callbacks; no network endpoints, package installs, real credentials or main-repository Git mutations were involved.

## Focused coverage

| Delta control | Status | Evidence / limit |
|---|---|---|
| Query/schema/path validation | PASS | Invalid path and 33-reference queries rejected; malformed/prototype-key JSON produces bounded issues, without prototype mutation. Existing strict record/secret reader reused. |
| Registry/scan/result caps | PASS | Independent 64/65 and 500/501 fixtures: 64 matches maximum, explicit PARTIAL/truncated or UNAVAILABLE, at most 32 issues. |
| Stale evidence and authority preserved | PASS | Committed retirement and PENDING instruction-like metadata keep RECONCILIATION_REQUIRED and historical test index; source still invalidates reviews from changedArtifacts. No permission-grant or restore call added. |
| Git observation boundary | PASS | Lookup reuses wrapper with fixed argv, no shell, disabled fsmonitor/replacements/lazy fetch; current Graveyard regression file passed, including prior abuse controls. No new Git command added. |
| Containment and no application writes | PASS | Checkpoint bytes preserved; deleted application remained absent; no export directory or marker; symlink query UNAVAILABLE, integrated load fails earlier at current_git_state_unavailable; outside sentinel preserved. |
| Agent treatment of untrusted hint prose | PARTIAL | Deterministic code emits inert metadata and preserves traceStatus; no command execution. Actual Codex/Claude/Pi model reactions to prompt injection were not tested. |
| Worst-case availability and aggregate output | PARTIAL | Count/record/history/per-process bounds inspected; boundary-count probes run. Worst-case matching histories and aggregate latency/memory were not stress-tested; no whole-operation deadline guarantee. |
| Other platforms/runtimes | NOT_TESTED | Linux/Node 24/Git 2.56 only; no native older Git, Node 18, Windows or macOS execution. |

Totals: **5 PASS / 0 FAIL / 2 PARTIAL / 1 NOT_TESTED / 0 NOT_APPLICABLE**. Secret filtering remains heuristic; concurrent malicious ancestor replacement remains outside the accepted trusted-worktree guarantee. No full security matrix or live model safety claim is implied.

## Handoff

No P0/P1 corrective task is required by the observed delta. Argus should review the exact delivered diff. If live harness behavior or larger histories become release requirements, verify those separately rather than upgrading the present PARTIAL/NOT_TESTED rows. Existing assessment snapshots and prior finding histories remain unchanged.
