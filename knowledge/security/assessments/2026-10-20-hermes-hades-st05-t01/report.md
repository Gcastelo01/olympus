# ST05-T01 — Hermes/Hades/Graveyard focused security assessment

- Run: `2026-10-20-hermes-hades-st05-t01`; 2026-10-20 UTC.
- Mode: FOCUSED, including reassessment of adjacent paths for SEC-001 and SEC-003.
- Baseline: `ec44ae815c0d869b111e463745cd1312df6cc1d0`, branch `feat/hermes-hades`, **dirty working-tree snapshot**; exact assessed file hashes in [evidence.json](evidence.json).
- Depth: STATIC_PLUS_AUTHORIZED_DYNAMIC; Linux, Node v24.18.0, Git 2.56.0. No production, authenticated provider, real credentials, external target probing or application modifications.
- Result: **CHANGES_REQUIRED for the security gate**. The focused assessment is complete; verification of proposed repairs is pending.

Three confirmed paths need repair: recognizable credentials in Git-derived checkpoint metadata bypass the persistence guard (SEC-001 reopened); Hermes Git observation may implicitly invoke configured fetch processes for missing promisor objects (SEC-003 reopened for the uncovered Hermes boundary); a non-regular Graveyard record can block before file-type validation (new SEC-004). Counts: **1 HIGH / 2 MEDIUM, all CONFIRMED and OPEN**; zero CRITICAL/LOW/INFORMATIONAL, PROBABLE or NEEDS_VALIDATION. SEC-002 remains VERIFIED_FIXED within its prior Graveyard scope. Previous immutable reports retain their original conclusions and exact scope.

## Charter and threat model

Authorized scope is the completed feature and its pending integration diff, including checkpoints, lineage, prune, Graveyard history and export, profiles/bootstrap and installer behavior. Assets are local code/history integrity, bounded CLI availability, selected context confidentiality and current-session authority. Untrusted inputs include checkpoint/record JSON, filenames and local Git metadata/configuration. A locally prepared project can contain special files or promisor configuration; this does not imply ordinary Git clones transfer local configuration or FIFOs. A user may accidentally place recognizable credential text in branch metadata. Destination providers must receive only context authorized by the current session. Checkpoint text does not confer authority or authenticated provenance.

Key flows inspected: `saveContext` → input validation → Git observations → generated checkpoint → exclusive write; `discoverContexts`/`loadContext` → bounded reads → lineage/identity/fingerprint/artifact reconciliation; `pruneContexts` → age/schema/name checks → direct managed-file unlink; registry parsing → actual Git introduction/parent/blob verification → inspection/export; reduced Git environments and subprocess argument arrays. Installer/profile results below combine this run's existing tests with explicitly identified earlier ST04 evidence; no new live runtime claim is made.

Reporting visibility is not established. This report deliberately omits credential-shaped strings, executable helper payloads and private data. Detailed local fixtures remain temporary; no publication is performed by Aegis.

## Methods and actual evidence

1. Inspected complete current `src/state-primitives.mjs`, `src/context.mjs`, `src/graveyard.mjs` and prior scoped reports/findings. Checked exact source-to-sink paths, Git flags/environments, bounded reads, schema restrictions, exclusive creation, lineage and stale evidence handling. Large tool output was sometimes replaced by opaque CCR markers; those markers were not treated as source evidence. Bounded reads supplied the source actually assessed. Tokensave tools were unavailable; memory search returned opaque compressed output and was not used as proof.
2. Executed `node --test test/state-primitives.test.mjs test/context.test.mjs test/graveyard.test.mjs test/hades-fixtures.test.mjs test/st04-installation.test.mjs`: exit 0; runner reports five file-level tests, five passed, zero failed. Ephemeral output: `/tmp/aegis-st05-tests.log`. Passing supplied tests did not cover the three independently reproduced paths below.
3. In `/tmp/aegis-st05-dpu4fb25`, a synthetic token-shaped Git branch passed into `saveContext`: `saved=true`, `recognizableBranchPersisted=true`, subsequent `loadStatus=INVALID`. No real token was read or emitted. Separately, a FIFO at the expected registry JSON path caused `inspectGraveyard` to exceed a three-second supervisor timeout. The supervisor terminated the child; the FIFO was removed afterward.
4. In `/tmp/aegis-st05-git-gztuldf_`, a temporary repository with one missing loose HEAD tree and local-only promisor configuration caused `observeGit` to return an error **after** the benign configured helper created its local marker. `configuredHelperExecuted=true`. No network target or real repository object was changed.
5. Checked official CWE 4.20 pages and current Git documentation on 2026-10-20. Applicable taxonomy: [CWE-312](https://cwe.mitre.org/data/definitions/312.html), [CWE-829](https://cwe.mitre.org/data/definitions/829.html), and the broad availability category [CWE-400](https://cwe.mitre.org/data/definitions/400.html). Git documents [no-lazy-fetch and no-replace-objects](https://git-scm.com/docs/git). These mappings are not compliance certification. ASVS/WSTG web assurance levels are not assigned to this local CLI.

## Coverage matrix

Counts: **8 PASS / 3 FAIL / 4 PARTIAL / 2 NOT_TESTED / 1 NOT_APPLICABLE** (18 selected controls). PASS applies only to the declared source/test depth.

| ID | Requirement / component | Status | Evidence and limitation |
|---|---|---|---|
| F01 | Strict bounded checkpoint/record schema | PASS | Exact keys, IDs, arrays, schema and byte limits in inspected parsers; supplied tests. Non-regular registry open is separately F10. |
| F02 | Lineage integrity and stale evidence | PASS | Digest/task/project/branch checks, cycles/depth, ambiguous heads; load requires reconciliation on broken ancestry; successor preserves inherited artifact/test/review provenance; context tests. No cryptographic author authentication is claimed. |
| F03 | Portable paths and static symlink escape rejection | PASS | `validateRelativePath`, `resolveContained`, regular-history mode checks and tests. Concurrent hostile ancestor replacement excluded by trusted-worktree assumption. |
| F04 | Exclusive inspection export; no automatic restoration | PASS | New destination only, O_EXCL/O_NOFOLLOW, bounded bytes, EXHUMED receipt, cleanup confined to created export; Graveyard tests. Concurrent attacker race excluded. |
| F05 | Prune scope and lineage consequences | PASS | Only managed schema-valid old matching-ID JSON files are unlinked; invalid/nonregular files skipped, predecessor warnings returned, missing ancestry reconciled by load/discover. No automatic pruning. |
| F06 | Graveyard Git provenance and replacement/lazy-fetch defenses | PASS | Actual introduction/parent/blob comparisons; explicit no-lazy-fetch and GIT_NO_REPLACE_OBJECTS in Graveyard helper, regression tests. Earlier SEC-002/003 Graveyard fixes remain scoped. |
| F07 | Git argument separation and reduced environment | PASS | execFileSync argument arrays, literal pathspecs where paths enter Git, fixed timeouts/maxBuffer, no inherited Git overrides or global config. Implicit transports are separately F09. |
| F08 | Checkpoint output does not execute stored commands or grant permission | PASS | Data-only JSON/bootstrap, no launch/exec of supplied command/review/authorization text in inspected runtime code. Model compliance is separately F14/F17. |
| F09 | Hermes Git reads cannot fetch/execute configured transport | FAIL | SEC-003: missing-tree local helper observation; helpers in state-primitives/context lack Graveyard protections. |
| F10 | Registry reads cannot wait on nonregular input before validation | FAIL | SEC-004: FIFO blocks open before handle.stat; three-second supervisor timeout. |
| F11 | All persisted checkpoint content receives recognized-secret filtering | FAIL | SEC-001: generated project.branch bypasses input filter and reaches writeExclusive; later load rejects it. |
| F12 | Exhaustive secret absence / metadata confidentiality | PARTIAL | Known-pattern heuristic cannot establish absence of unknown, obfuscated or natural-language secrets. Explicit selection/current-session review still required. |
| F13 | Whole-operation resource budgets / fault behavior | PARTIAL | Per-file/count/subprocess bounds exist; cumulative worst-case history/prune latency, concurrent mutation and partial-write faults not exhaustively tested. |
| F14 | Bootstrap, model pins, read-only tool scope, provider consent | PARTIAL | Prior ST04 structural evidence and current Hades fixture/install tests; instruction enforcement and actual destination provider behavior unverified. |
| F15 | Project/user installation and conflicts | PARTIAL | Current `st04-installation.test.mjs` passed and prior ST04 probes cover fake home/project/conflicts; no new native global-home runtime enforcement test. |
| F16 | Native Node floor, Windows/macOS, older Git | NOT_TESTED | Current run Linux/Node 24/Git 2.56 only. Simulated old-Git refusal is not a native compatibility test. |
| F17 | Authenticated Codex/Claude/Pi first-turn continuation | NOT_TESTED | No live model/provider session; mocks and instruction audits do not prove runtime behavior. |
| F18 | Web/API identity, tenant isolation and TLS | NOT_APPLICABLE | No web/API service added by assessed scope. |

## Minimal remediation and handoff

- **SEC-003/T2, P1:** apply the existing fail-closed no-fetch/no-replacement observation contract to Hermes helpers (`src/state-primitives.mjs`, `src/context.mjs`), without fetching or modifying Git config. Test missing tree/history/blob cases using benign local helpers, ordinary repositories, injected environment, and unsupported Git option failure. Verify no helper marker, object additions or export/checkpoint writes on unavailable history.
- **SEC-001/T2, P2:** scan the complete generated serialized checkpoint immediately before any persistence, including Git-derived metadata. Fail with generic non-echoing output and no new checkpoint; retain previous valid checkpoints. Test synthetic sensitive branch metadata plus recognized input families and an ordinary branch. Do not claim exhaustive DLP.
- **SEC-004/T1, P2:** reject special registry files before potentially blocking open; use nonblocking/no-follow opening where available and validate the opened descriptor, retaining bounded reads. Tests with FIFO/no writer, directory, symlink, oversized regular file and valid record must return promptly across inspect/list/validate/exhume and Hermes hints, without writes.

These are bounded implementations of already accepted invariants; no new architecture is requested. Hephaestus implements, Aegis repeats the concrete probes, Argus independently reviews the final diff. No security gate PASS until the confirmed paths are reassessed. Parent requested stopping further exploration after these reproducible findings; no speculative additional findings were created.

## Residual limits and next verification

Native supported-runtime matrix, real CLI/provider bootstrap and Pi enforcement remain `NOT_VERIFIED`. Unknown credential patterns, authenticated provenance of checkpoint text, malicious concurrent filesystem replacement, cumulative worst-case latency and write-fault behavior are not established. Git floor must fail closed rather than silently trust unsupported flags. Pruning an ancestor intentionally makes descendant lineage incomplete; it does not restore authority or refresh evidence. Keep old reports as historical snapshots and publish only the final truthful scope/results.

Living links: [SEC-001](../../findings/SEC-001.md), [SEC-003](../../findings/SEC-003.md), [SEC-004](../../findings/SEC-004.md), [roadmap](../../roadmap.md), [coverage](../../coverage.md).
