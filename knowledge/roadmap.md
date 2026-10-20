# Installer update roadmap

| Stage | Outcome | Prerequisites | Status | Tasks |
| --- | --- | --- | --- | --- |
| [01-installer](stages/01-installer/README.md) | Safe installer modes and adapted launchers integrated | Accepted Athena handoff | PENDING | 1 |

Next unblocked task: [ST01-T01](stages/01-installer/tasks/ST01-T01.md). Dependency graph: accepted contract → ST01-T01 → independent Argus review. One bounded integration task; its ordered work passes keep security preflight ahead of writes and user entry points.

| Requirement / invariant | Task | Evidence |
| --- | --- | --- |
| Install conflict rejection; update preserves local semantics; upgrade/force ownership | ST01-T01 | Static branch and hash-policy review |
| User scope and read-only check | ST01-T01 | CLI-to-core mapping and side-effect review |
| Safe lock/backup paths, lock schema/hash validation | ST01-T01 | Preflight and rejection-path review |
| Protected AGENTS.md, orphans and dirty baseline preserved | ST01-T01 | Baseline comparison and diff review |
| Launcher adaptation, packaging inventory and documentation | ST01-T01 | Cross-file CLI/package/doc consistency review |

Risks: ZIP paths and auxiliary files are untrusted; user-scope writes reach outside projects; runtime and target-platform behavior remain unverified because this session forbids tests. No wholesale package identity, publishing pipeline or plugin import.


## Hermes Hades v1.3

Current active plan. Source: [Athena READY contract](architecture/hermes-hades.md); revision `d881797f16d3aec3465c0da7504dbd4963c7f7f4`. Seven stable task IDs are preserved. ST02-T01 is implemented and committed as `41e7a42`. ST02-T02 is DONE: implementation commit `c10d36b`, followed by administrative ledger commit `8b88166`; its recorded Argus PASS and Aegis SEC-001 VERIFIED_FIXED evidence are preserved. Stage 02 is complete. ST03-T01 is DONE in commit `7b1965f07c9d8b2b59ea165dbc0e42e72c1cd679`, with recorded final Argus PASS and Aegis SEC-002/SEC-003 VERIFIED_FIXED reassessment. ST03-T02 is DONE in commit `ec44ae815c0d869b111e463745cd1312df6cc1d0`, with recorded Argus PASS and a focused Aegis review reporting no new finding. Stage 03 is complete; runtime startup integration remains in ST04-T01. Historical ST01-T01 is outside this change.

| Stage | Outcome | Dependencies | Status | Tasks |
| --- | --- | --- | --- | --- |
| [02-continuity](stages/02-continuity/README.md) | Bounded state primitives, deterministic discovery and validated continuation | Accepted architecture | DONE | 2 |
| [03-graveyard](stages/03-graveyard/README.md) | Verified retirement tracing, safe inspection export and reconciliation links | ST02-T01; bridge also ST02-T02 | DONE | 2 |
| [04-hades-integration](stages/04-hades-integration/README.md) | Canonical skills, runtime profiles, package/install integration and v1.3.0 | ST02-T02, ST03-T02 | DONE | 1 |
| [05-release-evidence](stages/05-release-evidence/README.md) | Security assessment, grounded documentation and final audit evidence | ST04-T01 | DONE | 2 |

Delivery complete: [ST05-T02](stages/05-release-evidence/tasks/ST05-T02.md), ST04-T01 and ST05-T01 are DONE. Commits `4522f3c` and `16363e3` were pushed only to `feat/hermes-hades`; [PR #1](https://github.com/Gcastelo01/olympus/pull/1) is OPEN against `main`, awaiting maintainer review/merge. No merge has been performed. Technical DAG: ST02-T01 → ST02-T02 and ST03-T01; both → ST03-T02 → ST04-T01 → ST05-T01 → ST05-T02. Execute serially in table order; no simultaneous writers.

| Requirement / invariant | Task | Verification gate |
| --- | --- | --- |
| Untrusted bounded JSON, safe paths/Git/secret handling and content-aware fingerprints | ST02-T01, ST05-T01 | Offline malicious inputs, temp Git repos, Aegis assessment |
| Save/inspect/discover/load/prune, taskStatus and digest-checked supersedes, schema/identity/branch/age/dirty/reference reconciliation, exact review invalidation | ST02-T02 | Positive/failure fixtures and application bytes unchanged |
| Prior-task/milestone/handoff checkpoint production; first-actionable-turn Zeus→Hermes discovery/load in Codex/Claude/Pi | ST02-T02, ST04-T01, ST05-T02 | Chain/failed-save fixtures, canonical instruction references and authenticated first-turn probes or NOT_VERIFIED |
| Safe single unfinished head selection, ambiguity/invalid/missing-lineage/limit handling and no timestamp guessing | ST02-T02, ST05-T01 | Offline adversarial discovery fixtures; metadata-only output and no writes/partial selection |
| Optional memory absent, fixed bootstrap, provider trust/opt-out and no authority restoration | ST02-T02, ST04-T01, ST05-T02 | Simulated handoffs plus clearly distinguished live evidence |
| Real record schema and retirement commit/blob resolution; squash, rename, partial symbols, missing history | ST03-T01 | Deterministic before/after temporary Git histories |
| EXHUME inspection/export, no overwrites; lifecycle and BURY authorization boundaries | ST03-T01, ST03-T02, ST04-T01 | Export collision/application snapshot tests and procedure review |
| Graveyard explains removed/divergent checkpoint artifacts, never restores them | ST03-T02 | Context/graveyard integration fixtures |
| Hades evidence classification, progressive optional tooling and conservative unknown usage | ST04-T01 | Fixture/oracle coverage plus actual diagnosis evidence or NOT_VERIFIED |
| Central pins, generated Claude allowlist, supported read-only profiles and no Hermes agent | ST04-T01 | Generator/structural checks and runtime-specific evidence |
| Packaging, Node >=18, project/user installs, conflict preservation, no transient state distribution | ST04-T01 | Offline package inventory and temp-home install/update/conflict checks |
| Grounded docs, release version, final exact-diff Argus and scoped commits/PR | ST04-T01, ST05-T02 | Recorded commands/results, independent review, branch/PR evidence |

Risks: no supported Pi Hades tool restriction has yet been demonstrated. A later isolated local `pi --help` succeeded; Athena now selects shared AGENTS→Zeus→Hermes for Pi first-turn startup without an extension. The earlier EROFS help attempt is historical, not evidence that Pi is manual-only. CLI help availability is not authenticated invocation/delegation proof. Root discover/load does not require the external subagent harness; Hephaestus writes do. Preserve trust/opt-out and custom configuration. Unsupported isolation must be reported honestly, with Athena's read-only-environment fallback; no invented flags/config. Cross-platform/runtime checks may be NOT_VERIFIED, with steps. No benchmark claim, automatic fetching, services, extra production dependencies or duplicated code archive.

Current delivery state: Stage 04/ST04-T01 and ST05-T01 are DONE; ST05-T02 and Stage 05 are DONE for the authorized PR delivery scope. Final Argus PASS applies to full snapshot `81b4dabf12a7e3f86f08a938db37a1b175daca52c169030959ae5b59b261b843` against base `ec44ae8`, with no blocking findings. ST05-T01 has independent Aegis PASS at its recorded hashes (SEC-001/003/004 VERIFIED_FIXED); ST05-T02 documentation and validation are complete. Implementation commit `4522f3c` and bookkeeping commit `16363e3` were pushed only to `feat/hermes-hades`. [PR #1](https://github.com/Gcastelo01/olympus/pull/1) is confirmed OPEN, base `main`, head `feat/hermes-hades`, awaiting maintainer review/merge. Recorded local checks passed; live runtime and unavailable platform checks remain NOT_VERIFIED. No merge has been performed.
