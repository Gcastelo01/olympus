# Hermes ST02-T02 — focused security snapshot

Immutable assessment snapshot, 2026-10-20, completed around 19:37 UTC. Mode FOCUSED; depth STATIC_PLUS_AUTHORIZED_DYNAMIC. Scope: JSON input/checkpoints, containment and file reads, Git subprocesses, credential persistence/output, historical permissions, pruning. Excludes Hades/Graveyard, installer, live runtime execution and whole-project certification.

## Baseline

Repository `/home/gcastelo/Documentos/Pessoal/olympus`; branch `feat/hermes-hades`; HEAD `41e7a42ea8aa72fb1f6e3fd830c82168087ab0d0`; dirty working tree with active implementation and planning edits. Inspected source hashes:

| File | SHA-256 |
| --- | --- |
| `src/context.mjs` | `dac65890650039eda1a8d94f48573368635f3a8467a29c48db106e049f2e35e9` |
| `src/state-primitives.mjs` | `cae011a66b5a7e4eeb62a67114553531bf82ca81d4763c3a81ef0979cebad3bf` |
| `bin/olympus.mjs` | `35a5e2048330dca901f88e18fe738cfb4bcf31f2c590686f22a5b60fc694fcaa` |
| `test/context.test.mjs` | `e955621e1c6d0d9729569ac056a3c11c9a31679ade256a49f64f217b02497d03` |

Environment: Linux, Node v24.18.0, Git 2.56.0. These hashes bind inspected evidence, not a clean commit. Later edits require relevant reassessment.

## Threat model and conclusions

Assets are project files, current authority, review provenance and confidential work context. Entry points are explicit JSON input/stdin, local checkpoint files, artifact paths/content and repository Git state. Actors include a mistaken user/agent supplying sensitive text, untrusted repository/checkpoint authors and destination agents consuming output. Execution assumes a trusted worktree and trusted installed Git binary; malicious concurrent directory replacement by an OS user is excluded by Athena's contract.

The flow is CLI → bounded JSON/schema → Git/path observation → immutable checkpoint → revalidation → JSON output → destination agent. Stored prose must not become executable authority. Paths must not escape the project, processes must not execute state-derived commands, and recognizable credentials must not be persisted. Fixed bootstrap text, restricted Git argv/environment, exclusive files and static symlink rejection support these boundaries. Hashes detect drift; they are not authentication signatures.

One material weakness was confirmed: common recognizable credential formats pass the filter and reach persisted/output context. Evidence status/severity counts: **1 CONFIRMED / MEDIUM**, zero other findings. Priority P1; no emergency containment indicated. Recommended next action is the narrow scanner fix under [SEC-001/T1](../../roadmap.md), then security reassessment and independent Argus review.

## Evidence actually obtained

- Read current Aegis skill, Athena security/continuity contract, current primitives/context/CLI source, relevant tests and README; inspected Git status/diff summary.
- Synthetic parser probes: classic GitHub, fine-grained GitHub and bearer annotation were accepted; named API-key control was rejected.
- Synthetic temporary Git fixture: all three accepted formats persisted, were echoed by inspect, and were returned by load with READY. No real token, external account or network target used; fixture cleaned afterward.
- Ran `node --test test/context.test.mjs test/state-primitives.test.mjs`: exit 0; runner reported 2 test files passed, 0 failed. This result did not cover SEC-001's missing regression cases.
- Consulted official [GitHub token formats](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-authentication-to-github#githubs-token-formats) and [MITRE CWE-312 v4.20](https://cwe.mitre.org/data/definitions/312.html). CWE is taxonomy only. No vulnerability scanner, dependency install, production probe or exploit against real data was performed.
- Tokensave tools/database were unavailable; source inspection supplied the evidence. No previous-session memory was treated as implementation truth.

## Coverage and limits

[Coverage matrix](../../coverage.md): **6 PASS / 1 FAIL / 3 PARTIAL / 2 NOT_TESTED / 1 NOT_APPLICABLE**. Main gaps are runtime/model behavior, platform support, concurrent file growth/replacement and final evidence provenance review while implementation is active. No broad claim of security or compliance follows from these checks.

Repository visibility was not established. This snapshot deliberately omits complete credential-shaped samples and executable reproduction payloads; no sensitive data was persisted. Aegis modified only `knowledge/security/` documents and did not implement, commit or approve application changes.
