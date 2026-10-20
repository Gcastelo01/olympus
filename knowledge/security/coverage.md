# Hermes security coverage

Scope and baseline: [2026-10-20-hermes-st02-t02](assessments/2026-10-20-hermes-st02-t02/report.md), dirty snapshot based on `41e7a42ea8aa72fb1f6e3fd830c82168087ab0d0`.

The credential-filter row was independently reassessed in [2026-10-20-hermes-st02-t02-02](assessments/2026-10-20-hermes-st02-t02-02/report.md) against the new recorded source/test hashes. Other rows retain the original assessment scope and limitations; rerunning the two test files does not recertify untested areas.

Selected requirements come from Athena's accepted security contract and the user's Hermes requirements. This local CLI is not assessed against web ASVS/WSTG or an invented assurance level. MITRE CWE 4.20 is a weakness taxonomy, not certification; [CWE-312](https://cwe.mitre.org/data/definitions/312.html) was verified on 2026-10-20 and maps to prohibited secret persistence in SEC-001.

| Control | Status | Method / evidence | Limit |
| --- | --- | --- | --- |
| Strict bounded checkpoint JSON and schema | PASS | `src/context.mjs:21`, `:141`; `parseBoundedJson`; existing two test files passed | Schema validity is not authenticity |
| Portable path containment and existing symlink rejection | PASS | `src/state-primitives.mjs:44`, `:62`; existing tests | Trusted worktree; concurrent hostile ancestor replacement excluded |
| Bounded reads throughout input, refs and snapshot | PARTIAL | Checkpoint descriptor reads are capped; `readContextInput`, `readSafeReference`, `observeGit` use stat followed by `readFile` | Concurrent file growth/replacement was not tested; directory enumeration allocates before its checkpoint count cap |
| Git command/argument/environment boundaries | PASS | `src/context.mjs:207`; `src/state-primitives.mjs:119`; fsmonitor test passed | Local Git configuration and executable remain trust assumptions; no arbitrary remote targets contacted |
| Recognizable credentials rejected before storage/output | PASS | Independent seven-family raw/escaped save, artifact, stored inspect/load/discover and CLI no-echo probes; regression tests passed | [SEC-001](findings/SEC-001.md) VERIFIED_FIXED at reassessed hashes; not an exhaustive secret scanner |
| Recovered prose stays subordinate to current policies | PARTIAL | Fixed `safeBootstrap`; CLI JSON output, no dynamic evaluation | Destination LLM behavior and first-turn integration not evaluated |
| Historical permissions never execute actions | PASS | `historicalAuthorizations` is data; no process/permission mutation derived from it | CLI only; runtime policy enforcement remains separate |
| Exclusive immutable checkpoint persistence | PASS | `writeExclusive` with O_EXCL / restrictive mode; tests passed | No concurrent hostile OS-user guarantee; no fsync durability claim |
| Explicit prune targets validated managed files | PASS | `pruneContexts`; existing prune/symlink tests passed | Explicit prune may break lineage and reports that; not automatic retention |
| Review/evidence validity against current state | PARTIAL | `loadContext` artifact/hash logic and regression tests | Concurrent implementation changes; final Argus audit required; no authenticating signature |
| Supported platform/Node matrix | NOT_TESTED | Only Linux, Node v24.18.0, Git 2.56.0 observed | Node 18, macOS, Windows outstanding |
| Live authenticated runtime handoff | NOT_TESTED | No live sessions invoked | Simulated metadata transfer is not integration evidence |
| Web sessions, tenant authentication, outbound runtime launch | NOT_APPLICABLE | No such interface in assessed Hermes commands | Does not cover future additions |

Totals: **7 PASS / 0 FAIL / 3 PARTIAL / 2 NOT_TESTED / 1 NOT_APPLICABLE**. PASS is limited to the declared inspection depth and trusted-worktree assumptions. Unknown or obfuscated credential formats remain outside heuristic recognition.
