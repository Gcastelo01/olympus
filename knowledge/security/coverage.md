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

## Graveyard ST03-T01 — 2026-10-20

FOCUSED, STATIC_PLUS_AUTHORIZED_DYNAMIC; dirty snapshot on `8b881663e24261339728696816d4ffeaeec52a2d`. Exact hashes and executed methods in [snapshot](assessments/2026-10-20-graveyard-st03-t01/report.md). CWE 4.20 taxonomy identifiers verified against official MITRE pages; no ASVS/web compliance assertion. Existing Hermes coverage above remains scoped to its own assessment.

| Control / reference | Status | Evidence and limit |
|---|---|---|
| GV-01 Fixed argv, environment isolation, fsmonitor; CWE-78 taxonomy | PASS | execFileSync with fixed argv; synthetic local fsmonitor and inherited GIT_DIR/GIT_CONFIG_COUNT probes did not execute marker or redirect repository. This does not cover lazy fetch (GV-02). |
| GV-02 No implicit configured process or remote access; CWE-829 | PASS | SEC-003 VERIFIED_FIXED at reassessed hashes: blob/tree promisor protected probes show no helper invocation or object addition; unsafe controls invoke helper. Explicit --no-lazy-fetch plus env; native old Git not tested. |
| GV-03 Descriptor-to-object integrity; CWE-354 | PASS | SEC-002 VERIFIED_FIXED at reassessed hashes: blob and commit replacements ignored; JSON/export bytes and trace use original objects; replacement refs preserved; unsafe controls prove substitution is active. |
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
| GV-15 Absent registry behavior | PASS | Repeated list/validate empty fixture and final CLI suite covering list/search/validate plus missing-ID failures; no registry creation. |
| GV-16 Web identity/session/API controls | NOT_APPLICABLE | focused local CLI has no web/auth/session surface. |

Totals after reassessment: **10 PASS, 0 FAIL, 3 PARTIAL, 2 NOT_TESTED, 1 NOT_APPLICABLE**.

Current Graveyard run: [2026-10-20-graveyard-st03-t01-02](assessments/2026-10-20-graveyard-st03-t01-02/report.md), REASSESS of SEC-002/003 on exact updated hashes, with selected regression checks. Original results remain in the immutable initial snapshot. Only GV-02/GV-03 changed status; other limitations are carried forward. Native older Git remains NOT_TESTED; unsupported-option behavior was simulated.
