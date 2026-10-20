# Aegis focused assessment — ST03-T01 Graveyard

- Run: 2026-10-20-graveyard-st03-t01; executed 2026-10-20 UTC.
- Mode: FOCUSED; depth: STATIC_PLUS_AUTHORIZED_DYNAMIC.
- Baseline: `8b881663e24261339728696816d4ffeaeec52a2d`, `feat/hermes-hades`, dirty working-tree snapshot. This is not a reviewed clean commit.
- Scope: Graveyard parser, Git wrapper/history/blob reads, CLI routing, export containment, collisions, cleanup, sensitive-content handling.
- Excluded: full Hermes reassessment, Hades/runtime profiles, installer, live external services, real credentials, destructive main-repository tests.
- Authorization: user authorized safe local integration/security tests; Zeus requested focused attack-boundary validation. Only isolated synthetic repositories were changed by probes.
- Reporting: repository visibility unverified; findings contain redacted source-to-sink evidence and outcomes, no executable helper payload or real secret. Detailed temporary probes are not published.

## Conclusion

Two confirmed findings: one HIGH/P1 (SEC-003, implicit fetch invokes configured process) and one MEDIUM/P2 (SEC-002, replacement objects falsify advertised recovered-blob provenance). No critical/low/informational, probable or needs-validation findings were counted. Address these before claiming observational Git isolation or reliable blob provenance. Existing SEC-001/Hermes status is outside this run and unchanged.

## Snapshot hashes (SHA-256)

- `src/graveyard.mjs`: `b80e153dbbb504894e8724b45e180d84537a536b02da7519fd4aafa6e318c51c`
- `src/state-primitives.mjs`: `d4430d0ce9675b7f705695516b280cf632854c9df89421b6fba12aa70757fc41`
- `bin/olympus.mjs`: `964fb22c5c30fd4571625b65a66696906d0dfd216ea1e525f84713c99420a226`
- `test/graveyard.test.mjs`: `7f3d085390d4601d4a37ef23716de152ba8899c07afeb5c83321e3a90fd2e17f`
- `knowledge/architecture/hermes-hades.md`: `8736beea9522b88b8edbfaa4fde94b6cd46269cb2b82f1ce63826bfe1388e595`

## Threat model

Assets are local application/worktree content, authentic Git object identity/history, operator process authority and potentially sensitive retired bytes. Untrusted inputs are Graveyard JSON, descriptors, historical blobs and repository-local Git metadata/configuration. A record contributor can supply data; a local repository preparer can also configure replacements or promisor remotes. Neither is presumed to control the running OS account or replace ancestor directories concurrently.

Flow: CLI parses target/ID → bounded record reader and strict schema → Git graph/tree resolution → bounded blob reader → sensitive-content check → inert JSON or exclusive inspection export. No record grants commit/restore permission. The trusted-worktree assumption excludes concurrent malicious ancestor swaps; Git executable and inherited PATH are trusted runtime inputs.

Main abuse classes: metadata substitution, unintended configured subprocess/network access, path/link escape, overwrite/cleanup damage, sensitive-content output and resource exhaustion. Reproduced failures are confined to the first two. Regex secret checks remain defense in depth, not sanitization of arbitrary historic source.

## Actual methods and results

- Read accepted Athena security/Graveyard contract, ST03-T01 task, current module/helper/CLI and fixture source.
- `node --test test/graveyard.test.mjs`: exit 0 (runner reported one passing test file, no failures).
- `node /tmp/aegis-st03-probe.mjs`: exit 0; six groups passed: fsmonitor/inherited Git env, synthetic credential rejection in both modes, oversized blob rejection, malformed identifiers, sentinel preservation after collision, absent-registry empty results.
- `node /tmp/aegis-st03-replace.mjs`: reproduced SEC-002; original ID advertised, replacement bytes returned.
- `node /tmp/aegis-st03-promisor.mjs`: reproduced SEC-003; configured local helper executed despite eventual unavailable error.
- All probe repositories cleaned by their fixture cleanup. No package install, main-repository mutation, real network fetch, live harness integration or security scanner was performed.
- Official Git and MITRE pages consulted on 2026-10-20. CWE 4.20 taxonomy: [22](https://cwe.mitre.org/data/definitions/22.html), [78](https://cwe.mitre.org/data/definitions/78.html), [59](https://cwe.mitre.org/data/definitions/59.html), [354](https://cwe.mitre.org/data/definitions/354.html), [829](https://cwe.mitre.org/data/definitions/829.html). [Git replacement behavior](https://git-scm.com/docs/git-replace) and [Git fetch-suppression options](https://git-scm.com/docs/git) support the proposed controls. No web ASVS compliance claim is applicable.

## Coverage

Totals: 8 PASS, 2 FAIL, 3 PARTIAL, 2 NOT_TESTED, 1 NOT_APPLICABLE.

| Control / reference | Status | Evidence and limit |
|---|---|---|
| GV-01 Fixed argv, environment isolation, fsmonitor; CWE-78 taxonomy | PASS | execFileSync with fixed argv; synthetic local fsmonitor and inherited GIT_DIR/GIT_CONFIG_COUNT probes did not execute marker or redirect repository. This does not cover lazy fetch (GV-02). |
| GV-02 No implicit configured process or remote access; CWE-829 | FAIL | SEC-003; missing promisor blob invoked configured local helper before generic failure. |
| GV-03 Descriptor-to-object integrity; CWE-354 | FAIL | SEC-002; local replacement blob emitted under original descriptor identity. |
| GV-04 Bounded JSON and conservative schema/IDs | PASS | 64 KiB record read, schema allowlist, bounded fields/OIDs, parser inspection and existing malformed fixtures; four additional malformed ID probes rejected. |
| GV-05 Literal paths; CWE-22 taxonomy | PASS | --literal-pathspecs, delimiter and exact returned-path comparison; existing traversal and pathspec-looking-filename fixtures pass. |
| GV-06 Non-regular files and ancestor links; CWE-59 taxonomy | PASS | resolveContained/lstat/O_NOFOLLOW and Git regular-mode checks; existing static symlink fixtures pass on Linux. Concurrent replacement and other OSes excluded. |
| GV-07 Exclusive contained export/collision preservation | PASS | exclusive mkdir/open, O_EXCL, restrictive modes; existing export tests plus unrelated sentinel preserved after collision. |
| GV-08 Partial-failure cleanup ownership | PARTIAL | static created flag limits recursive removal to newly created export root; no disk-full/partial-write/permission fault injection performed. Trusted-worktree assumption remains. |
| GV-09 Application/HEAD preservation and lifecycle separation | PASS | existing read-only recovery, descriptor mismatch, shallow, rename and rewrite fixtures pass; EXHUMED does not restore code. Provenance defect remains separately in GV-03. |
| GV-10 Resource bounds | PARTIAL | configured record/count/blob/aggregate/history/output/timeout caps inspected; >2 MiB historical blob rejected. Aggregate history exhaustion and timeout not dynamically exercised. |
| GV-11 Sensitive historical bytes and diagnostics | PARTIAL | shared heuristic scanner; synthetic JSON credential rejected before JSON/export emission; Git stderr hidden. Arbitrary credentials, binary/encoded content and all error branches not proven safe. |
| GV-12 Data does not execute restoration instructions | PASS | JSON result/receipt only; no evaluation of record text; no restore/commit operation. |
| GV-13 Node 18, Windows/macOS filesystem and Git behavior | NOT_TESTED | execution environment only Linux, Node v24.18.0, Git 2.56.0. |
| GV-14 Malicious concurrent ancestor replacement | NOT_TESTED | expressly excluded from Athena guarantee; no race attack attempted; require trusted workspace during export. |
| GV-15 Absent registry behavior | PASS | list/validate return empty records in fresh temporary Git repository without creating registry; revised implementation included in hashes. |
| GV-16 Web identity/session/API controls | NOT_APPLICABLE | focused local CLI has no web/auth/session surface. |

## Remediation and handoff

[SEC-003](../../findings/SEC-003.md) / SEC-003/T1 first, then [SEC-002](../../findings/SEC-002.md) / SEC-002/T1; both are narrow enforcement of accepted Athena invariants. Hephaestus implements, Aegis verifies the same probes on new hashes, Argus independently reviews the final diff. No autonomous fixes or commits by Aegis.

See living [roadmap](../../roadmap.md) and [coverage](../../coverage.md). Preserve this point-in-time report after repairs.

