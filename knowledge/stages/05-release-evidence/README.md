# 05-release-evidence — Security, documentation and final audit evidence

- Status: IN_PROGRESS
- Contract: [Athena READY](../../architecture/hermes-hades.md).
- Prerequisites: ST04-T01.
- Tasks: [ST05-T01](tasks/ST05-T01.md); [ST05-T02](tasks/ST05-T02.md).
- Sequence: ST05-T01 → ST05-T02; no parallel writes.

## Scope and interfaces

Aegis assessment, scoped remediation within contract, Orpheus product docs, final validation/Argus and authorized Git handoff. Follow strict schema v1, bounded resources, inert text, literal Git paths and project containment. Preserve existing CLI install/check behavior and installer policy. No new orchestration framework.

## Exit gates

No unresolved material finding hidden; docs match executed behavior; final Argus refers to delivered diff; feature PR prepared/open or concrete external blocker recorded. Every task records changed files, commands/results, independent approval and commit disposition. Nontrivial work requires Argus review before authorized scoped commit; final aggregate review includes docs and evidence. No stage is DONE on the existence of files alone.

## Risk, compatibility and documentation

Two unproductive repairs require a blocker/new diagnosis. Post-review changes need re-review; no merge or publication. Orpheus documents once ST04-T01 provides verified behavior, in ST05-T02. Hephaestus records any earlier documentation needs without inventing supported behavior. Return architecture conflicts to Athena and security findings to Aegis.


## Startup continuity amendment

Security/docs/final Argus include discovery lineage, metadata privacy, checkpoint-production provenance and startup integration. Authenticated Codex/Claude/Pi first-turn invocation stays NOT_VERIFIED until observed, with explicit trust/opt-out/ambiguity tests. No extension or process-start execution guarantee.

## Current evidence

ST05-T01 has Aegis security PASS at the recorded reassessment hashes; ST05-T02 documentation and validation work is complete. Final Argus PASS applies to full snapshot `81b4dabf12a7e3f86f08a938db37a1b175daca52c169030959ae5b59b261b843` against base `ec44ae8`, with no blocking findings. Implementation commit `4522f3c43198c25e8a6733bd59e2ae3bf2a712f8` is recorded on `feat/hermes-hades`, verified clean before this later status-only update. Feature-branch push and PR remain pending; the stage stays IN_PROGRESS. Live runtime and unavailable platform checks remain NOT_VERIFIED.
