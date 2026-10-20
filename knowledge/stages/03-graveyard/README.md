# 03-graveyard — Traceable retirement and safe historical inspection

- Status: DONE
- Contract: [Athena READY](../../architecture/hermes-hades.md).
- Prerequisites: ST02-T01 (DONE, `41e7a42`); ST03-T02 also requires ST02-T02 (DONE, `c10d36b`, ledger `8b88166`). ST03-T01 is DONE (`7b1965f07c9d8b2b59ea165dbc0e42e72c1cd679`), with recorded final Argus PASS and [Aegis reassessment](../../security/assessments/2026-10-20-graveyard-st03-t01-02/report.md) marking SEC-002/SEC-003 VERIFIED_FIXED. ST03-T02 is DONE (`ec44ae815c0d869b111e463745cd1312df6cc1d0`), with recorded Argus PASS, a focused Aegis review reporting no new finding, and the context/graveyard integration evidence in its task ledger. Both Stage 03 task commits are complete; ST04-T01 is the next unblocked task.
- Tasks: [ST03-T01](tasks/ST03-T01.md); [ST03-T02](tasks/ST03-T02.md).
- Sequence: ST03-T01 → ST03-T02; no parallel writes.

## Scope and interfaces

Versioned records, Git history lookup, exhumation and checkpoint references; no application retirement in this feature. Follow strict schema v1, bounded resources, inert text, literal Git paths and project containment. Preserve existing CLI install/check behavior and installer policy. No new orchestration framework.

## Exit gates

Actual descriptor-matching histories resolve; missing/ambiguous histories fail honestly; export never overwrites; Hermes reports graveyard links. Every task records changed files, commands/results, independent approval and commit disposition. Nontrivial work requires Argus review before authorized scoped commit; final aggregate review includes docs and evidence. No stage is DONE on the existence of files alone.

## Risk, compatibility and documentation

No self-referential commit SHA. Records belong to the retirement commit; rewritten/shallow histories may be unresolvable. Orpheus documents once ST04-T01 provides verified behavior, in ST05-T02. Hephaestus records any earlier documentation needs without inventing supported behavior. Return architecture conflicts to Athena and security findings to Aegis.
