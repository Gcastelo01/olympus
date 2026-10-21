# 02-continuity — Portable manual context continuation

- Status: DONE
- Contract: [Athena READY](../../architecture/hermes-hades.md).
- Prerequisites: Accepted architecture; baseline state preserved.
- Tasks: [ST02-T01](tasks/ST02-T01.md); [ST02-T02](tasks/ST02-T02.md).
- Sequence: ST02-T01 → ST02-T02; no parallel writes.

## Scope and interfaces

Bounded inert state utilities and checkpoints; no runtime launch, transcript export or memory service client. Follow strict schema v1, bounded resources, inert text, literal Git paths and project containment. Preserve existing CLI install/check behavior and installer policy. No new orchestration framework.

## Exit gates

Save/inspect/load/prune work offline in temporary repositories; invalid inputs fail closed and loads preserve application content. Every task records changed files, commands/results, independent approval and commit disposition. Nontrivial work requires Argus review before authorized scoped commit; final aggregate review includes docs and evidence. No stage is DONE on the existence of files alone.

## Risk, compatibility and documentation

Context is historical evidence; runtime authority is re-established. Immutable writes can be abandoned without changing application code. Orpheus documents once ST04-T01 provides verified behavior, in ST05-T02. Hephaestus records any earlier documentation needs without inventing supported behavior. Return architecture conflicts to Athena and security findings to Aegis.


## Startup continuity amendment

ST02-T01 is committed as `41e7a42`; ST02-T02 is DONE in implementation commit `c10d36b` and administrative ledger commit `8b88166`. Its ledger records Argus PASS and Aegis SEC-001 VERIFIED_FIXED. Completed CLI scope includes read-only discover, taskStatus/digest lineage, safe single-head selection, explicit ambiguity and no timestamp ranking. Preserve the recorded limitations and NOT_VERIFIED checks. Automatic Zeus first-turn integration is owned by ST04-T01. The next unblocked task is [ST03-T01](../03-graveyard/tasks/ST03-T01.md).
