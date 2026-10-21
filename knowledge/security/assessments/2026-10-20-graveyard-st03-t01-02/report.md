# Aegis reassessment — SEC-002 and SEC-003

- Run: 2026-10-20-graveyard-st03-t01-02; execution date: 2026-10-20 UTC.
- Mode: REASSESS; depth: STATIC_PLUS_AUTHORIZED_DYNAMIC.
- Baseline: HEAD `8b881663e24261339728696816d4ffeaeec52a2d`, branch `feat/hermes-hades`, **dirty working-tree snapshot**.
- Scope: previous replacement-ref provenance and implicit promisor-fetch findings; selected Graveyard regressions and final CLI dispatch tests.
- Exclusions: full-project security, Hermes re-certification, Hades profiles, installer, production/external targets, native unsupported Git versions and other OSes.
- Authorization: user and Zeus authorized safe isolated reproductions. Only temporary synthetic fixture repositories were modified. Aegis changed only security assessment documents; no commit.

## Result

**SEC-002 and SEC-003 are VERIFIED_FIXED on the hashes below.** Historical evidence remains CONFIRMED (one HIGH/P1 and one MEDIUM/P2). Zero open or new findings in this reassessment; no critical/low/informational, probable or needs-validation findings. This is not a complete product certification or an Argus verdict.

The wrapper now disables replacement objects consistently and suppresses lazy fetch with both environment and an explicit global Git option. The latter closes the compatibility gap where an older Git ignores an unknown environment variable. An unsupported option must reject before object access. An actual older Git binary was not run.

## Assessed SHA-256 hashes

- `src/graveyard.mjs`: `8f2e33909b6cd3594a27d78f9fc90197e7d2c5fa2afd3a34febc12b7610fd5f8`
- `src/state-primitives.mjs`: `d4430d0ce9675b7f705695516b280cf632854c9df89421b6fba12aa70757fc41`
- `bin/olympus.mjs`: `e1553ed9439cdbaf3f64176f16c172cd4c8acdbe305849d49dab70b2715af4cd`
- `test/graveyard.test.mjs`: `3236e2fc38bf342f2bc22225baf113aba5705c39573fe99713b574f6e67aefc8`
- `knowledge/architecture/hermes-hades.md`: `8736beea9522b88b8edbfaa4fde94b6cd46269cb2b82f1ce63826bfe1388e595`

The initial snapshot remains [immutable](../2026-10-20-graveyard-st03-t01/report.md). Its threat model and exclusions still apply. The changes assessed are narrow enforcement of accepted Athena isolation/provenance invariants; no new architecture or user authority is introduced.

## Independent dynamic evidence

Environment: Linux, Node v24.18.0, Git 2.56.0.

1. `node /tmp/aegis-st03-reassess.mjs` — exit 0, four groups:
   - Blob replacement: an unprotected Git control returned substitute bytes. Protected JSON and exclusive export returned original bytes, with original blob identity, and preserved the replacement ref.
   - Commit replacement: unprotected Git hid the record by substituting the parent commit. Protected inspection kept the actual retirement commit; exhumation returned original content.
   - Missing historical blob in a promisor fixture: protected inspection/exhumation/export did not create the configured local helper marker, did not add object-store entries, did not change the current application file and did not create an export directory. Unprotected Git subsequently invoked the benign helper, proving reachability of the original defect.
   - Missing parent tree: the same protected/unsafe controls passed; protected inspection returned TRACE_UNAVAILABLE without a helper marker or new object-store entries.
2. `node /tmp/aegis-st03-probe.mjs` — exit 0, six regression groups: local fsmonitor and inherited Git environment blocked; synthetic JSON credential rejected in both modes; historical blob over 2 MiB rejected; four malformed identifiers rejected; existing export collision preserved an unrelated sentinel; absent registry listed/validated empty without creation.
3. `node --test test/graveyard.test.mjs` — exit 0 after final source/test stabilization. Runner reported one passing test file, zero failures/skips. Source includes replacement and promisor regression fixtures, unsupported-option executable simulation, `search router` dispatch and absent-registry CLI cases.
4. Original probes repeated against the corrected module returned:
   - Replacement: `trace=BURIED, advertisesOriginal=true, bytesMatchOriginal=true, bytesMatchReplacement=false`.
   - Promisor: `configuredFetchHelperExecuted=false`, failure `Git history/object unavailable`.

Safe/unsafe controls used only a local synthetic helper that creates a temporary marker and exits unsuccessfully. No real remote or live network endpoint was contacted. Temporary repositories were cleaned by fixture callbacks. Observed absence of the configured helper and object-store additions supports the stated local boundary; it is not a general network monitoring claim.

## Static comparison and compatibility

- `src/graveyard.mjs:80` adds `GIT_NO_REPLACE_OBJECTS=1` and `GIT_NO_LAZY_FETCH=1` to the existing environment allowlist.
- `src/graveyard.mjs:82` adds global `--no-lazy-fetch` before the requested subcommand. Existing argv separation, fsmonitor override and bounded buffers/timeouts remain.
- Generic error handling exposes no Git stderr content.
- Graveyard CLI exits after emitting its command result, preventing dispatch into installer argument handling. The final test file covers command dispatch.
- Missing registry list/search/validate behave as empty metadata queries; inspect/exhume of a missing ID fail; neither flow creates the registry.
- Official [Git no-lazy-fetch documentation](https://git-scm.com/docs/git) and [Git 2.45 release notes](https://raw.githubusercontent.com/git/git/v2.45.0/Documentation/RelNotes/2.45.0.txt) support the explicit-option approach. The inspected [upstream Git 2.43 promisor implementation](https://raw.githubusercontent.com/git/git/v2.43.0/promisor-remote.c) lacks the environment control; the final code does not silently depend on that variable alone.
- Standards mapping remains CWE 4.20: [CWE-354](https://cwe.mitre.org/data/definitions/354.html) for SEC-002 and [CWE-829](https://cwe.mitre.org/data/definitions/829.html) for SEC-003. No compliance certification or CVSS score is asserted.

## Coverage and residual limits

GV-02 and GV-03 change FAIL → PASS on these hashes. Selected GV-01/GV-07/GV-10/GV-11/GV-15 regressions were repeated; other prior coverage retains its original scope. Current carried-forward totals: **10 PASS, 0 FAIL, 3 PARTIAL, 2 NOT_TESTED, 1 NOT_APPLICABLE**. See [living coverage](../../coverage.md).

- NOT_TESTED: native older Git, Node 18, Windows/macOS, malicious concurrent ancestor swaps. Unsupported Git rejection was simulated, not proven with a second installed Git build.
- PARTIAL: partial-write/disk-full cleanup, aggregate history/time/resource stress, arbitrary secret and encoded/binary content detection. None was upgraded to PASS.
- Trusted-worktree execution assumption remains: no guarantee against a concurrent OS actor replacing ancestor directories.
- Repository visibility is unverified; reports retain redacted observations and omit executable helper payloads and real secret material.

## Handoff

[SEC-002](../../findings/SEC-002.md), [SEC-003](../../findings/SEC-003.md), and [roadmap](../../roadmap.md) updated to VERIFIED_FIXED / VERIFIED respectively. No new remediation task is required by this scoped reassessment. Continue with Argus review of the exact final implementation diff and the remaining Olympus gates.
