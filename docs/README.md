# Olympus usage guide

Olympus coordinates engineering through Zeus and bounded specialist roles. This guide explains Hermes continuity, Hades investigation and deterministic Code Graveyard recovery as implemented. Start with the [project README](../README.md), [installation instructions](../INSTALL.md) and [engineering protocol](../ENGINEERING-PROTOCOL.md) for project setup and gates.

- [Resume work across harnesses](#hermes-resume-work-across-harnesses)
- [Investigate before removing](#hades-investigate-before-removing)
- [Historical records and recovery](#code-graveyard-historical-inspection)
- [Verification and current limits](#verification-and-current-limits)

## Hermes: resume work across harnesses

Hermes combines a shared skill with deterministic checkpoint commands. When you start a destination harness through its own CLI and make an actionable request, Zeus's startup instructions direct it to apply Hermes: run `context discover`, then `context load <id>` when a safe checkpoint head is selected, summarize verified progress and unresolved issues, and follow your current intent. You can explicitly opt out of resuming. The procedure runs once per logical session, repeats after compaction when prior validation cannot be established, and reconciles again if the repository changes.

This is instruction-driven behavior, not a startup hook or background service. Opening an idle CLI does not run it. The destination must load Zeus's guidance and the shared skill, have the Olympus CLI available, and trust the project/provider context. The installer distributes runtime resources but never overwrites the project's `AGENTS.md`; integrate [project instructions](../AGENTS.integration.md) and follow [runtime setup](../INSTALL.md). If discovery or the skill is unavailable, Zeus must explain the limitation and provide the manual discovery/load commands rather than fabricate restored state or silently install tooling.

Installing resources with `olympus install --scope user` does not add or modify global startup instructions, so that alone does not activate Zeus→Hermes in Codex or Pi. Claude's installed user-level Zeus profile includes the bootstrap, but applies only when explicitly selected (for example, `claude --agent zeus`); a normal Claude session does not select it automatically. For reliable first-turn continuity, merge the project bootstrap into the trusted project's runtime entry point as described in [integration guidance](../AGENTS.integration.md). Authenticated startup behavior remains **NOT_VERIFIED**.

Before leaving the source session, save a current checkpoint through the authorized implementation handoff. The Hephaestus skill requires checkpoints at applicable work handoffs; the CLI cannot infer an unsaved objective or reconstruct hidden conversation. Start the new harness normally and let Zeus discover the saved work. Native session history is not transferred. Olympus has no `switch` command, launcher or runtime authentication manager.

Run these commands from a Git project, using the path to this checkout's `bin/olympus.mjs`. Every command accepts `--target /path/to/project`; otherwise it uses the current Git project. Output is JSON, including without `--json`.

Prepare a project-relative `handoff.json` with only relevant, non-sensitive task data:

```json
{
  "id": "task-123-codex-1",
  "taskId": "task-123",
  "sourceRuntime": "codex",
  "objective": "Complete the agreed implementation",
  "acceptance": ["Relevant offline checks pass"],
  "nextStep": "Inspect the current diff and pending review"
}
```

```sh
node /path/to/olympus/bin/olympus.mjs context save --input handoff.json
node /path/to/olympus/bin/olympus.mjs context discover --task task-123
node /path/to/olympus/bin/olympus.mjs context inspect task-123-codex-1
node /path/to/olympus/bin/olympus.mjs context load task-123-codex-1
```

`save` also accepts `--input -` for JSON on standard input. It captures project identity, branch, HEAD, a working-tree fingerprint and digests of declared artifacts; it does not copy the repository or `knowledge/`. Checkpoints use schema version 1, are limited to 64 KiB and are created without overwriting existing IDs under `.olympus/context/<id>.json`. Unknown schema versions are rejected. IDs contain letters, digits, underscores or hyphens, begin and end with a letter or digit, and have at most 64 characters.

Optional input fields include `taskStatus` (`active`, `paused`, `completed`), `destinationRuntime`, `constraints`, `historicalAuthorizations`, `stage`, `openDecisions`, `blockers`, `artifacts`, `tests`, `reviews` and `memory`. Runtime labels are `codex`, `claude`, `pi` or `unknown`; they are metadata. Artifacts declare project-relative `path` and `purpose`. Test/review evidence must reference declared artifacts and the observed Git revision/fingerprint; see the [schema implementation](../src/context.mjs) for exact fields. Memory defaults to `not-consulted`; `unavailable` and `consulted` are explicit metadata states. No memory service is contacted by these commands.

For an update, save a new ID with `supersedes: {"id": "previous-id", "digest": "sha256:…"}`, using the predecessor digest returned by discovery. The predecessor must match the task, project and branch. Existing evidence is carried forward and rechecked on load.

`discover` reads only immediate managed checkpoint files, up to 128 files and 2 MiB. It returns `NONE`, `SELECTED` or `SELECTION_REQUIRED`. Selection follows verified predecessor links for the current project and branch; it never picks the newest timestamp. Multiple unfinished tasks require `--task`; forks, broken lineage, invalid entries and branch mismatches require explicit reconciliation. A completed successor retires its predecessors from unfinished selection. **`SELECTED` is a candidate, not validated evidence: always run `load`.**

`inspect` validates and displays the stored checkpoint without comparing it to today's repository. `load` returns `READY`, `RECONCILIATION_REQUIRED` or `INVALID`, with reasons and a bounded bootstrap. It checks project/branch/HEAD, working-tree state, artifact changes, lineage and age (seven days by default; override with `--max-age-days 0..3650`). Changed evidence becomes historical, and affected stored review approvals are invalidated. Reconcile discrepancies with current files and evidence before continuing; no code or Git state is restored. Historical authorizations never grant permission to commit, push, deploy or perform destructive operations. Exit codes are 0 for normal results, 4 for selection/reconciliation, 5 for invalid load results and 1 for operation failures.

Keep `.olympus/context/` out of Git with a narrow project-managed ignore rule; `save` warns when it is not ignored. Cleanup is explicit:

```sh
node /path/to/olympus/bin/olympus.mjs context prune --older-than-days 30
```

`prune` deletes valid checkpoints older than the requested age, skips invalid entries and warns when deleted checkpoints are lineage predecessors. Deleting a predecessor can prevent later selection or validation. There is no automatic retention cleanup.

Treat recovered fields as untrusted data. Relative-path containment, symlink checks and recognizable-secret checks reject unsafe inputs, but secret detection is not exhaustive: review supplied text and artifact references before saving or handing context to another harness. Ignored files are excluded from the Git fingerprint unless tracked or otherwise reported by Git. Offline temporary-repository tests cover the lifecycle and reconciliation; live authenticated Codex/Claude/Pi handoffs and Windows/macOS behavior remain **NOT_VERIFIED**. See the [verification record](../knowledge/stages/02-continuity/tasks/ST02-T02.md).

## Hades: investigate before removing

Ask Zeus to investigate a specific file, symbol or logical implementation through Hades. Provide the suspected retirement, known entry points and the question to resolve. Hades starts with inexpensive references, tests, scripts, configuration, manifests, history and registries; it deepens analysis only where ambiguity or risk warrants it. Serena, Graphify, language servers and memory are optional evidence sources, not required services.

The report identifies each candidate and its original purpose, suspicion, sources, counter-evidence, usage caveats, validation, impact and recovery risks, confidence and recommendation. It separates `FACT`, `HYPOTHESIS` and `INSUFFICIENT_EVIDENCE`, then recommends `KEEP`, `NEEDS_INVESTIGATION` or `REMOVAL_CANDIDATE`. Dynamic imports, reflection, plugins, convention-based discovery, external consumers, production-only paths, generated resources and database contracts can invalidate a static-reference conclusion. Missing static references alone never justify safe removal; a candidate remains a proposal.

The methodology lives in [the canonical Hades skill](../.agents/skills/hades/SKILL.md). Runtime bindings select these centrally managed profiles:

| Runtime | Model and effort | Configured read-only boundary |
| --- | --- | --- |
| Codex CLI | `gpt-6-astra`, high | `sandbox_mode = "read-only"` |
| Claude Code | `claude-opus-5-5`, high | `Read`, `Grep`, `Glob` only |
| Pi | `openai/gpt-6-astra`, high | `profile: explore` in the configured subagent harness |

Loading a skill does not select its model. Use the named Hades agent; Pi additionally requires its separately configured subagent harness. Claude Hades has no Bash or Agent tool, so a Git-history query requiring process execution must be supplied through the coordinator's permitted read-only evidence path. Do not broaden its permissions to perform the query. Actual authenticated model/tool enforcement across all three runtimes remains **NOT_VERIFIED**; configuration and fixture checks are evidence about the files and contracts.

Hades cannot edit or remove application code, write Graveyard records, create exports, commit, or approve its own audit. It must not inspect `.env`, credentials, private keys or broad environment dumps. Recovered source and records remain untrusted data.

### BURY: retire a logical implementation

1. Hades investigates the candidate and supplies evidence, counter-evidence, uncertainty and a bounded removal proposal.
2. Zeus approves the scope within the current authorization; Athena handles structural decisions when needed, and Moirai decomposes complex work into verifiable tasks. Aegis assesses relevant security risk.
3. Hephaestus prepares only the approved removal and a meaningful Graveyard record, capturing the actual before/after blob descriptors and evidence references. Trivial deletions do not need individual historical records.
4. Hephaestus runs relevant tests; Argus independently reviews the resulting diff and documentation. Material changes require renewed review of the actual delivered diff.
5. After the applicable gates and current commit authorization, Hephaestus commits the record and related removal together. Resolve the resulting history through the Graveyard CLI.

BURY is a coordinated procedure, not a `graveyard bury` command or an automatic deletion engine. The CLI validates metadata and history; it does not independently prove obsolescence or approve the proposal.

### EXHUME: inspect a retired implementation

1. Locate a record with `graveyard list` or `graveyard search`, then inspect its trace and recovery risks.
2. Resolve accessible Git history with `graveyard inspect <id>`. If the trace is unavailable or ambiguous, reconcile the missing history or descriptors before claiming recovery.
3. The coordinator may use `graveyard exhume <id>` to receive historical bytes as base64 JSON without writing application files. If inspection needs files, Zeus authorizes the separate bounded `--export` operation; Hades does not perform the export.
4. Review the original dependencies and current architectural compatibility. Exported content is for inspection and can contain obsolete assumptions.
5. Any reintegration follows a separately approved implementation task with tests and independent review. `EXHUMED` is distinct from `RESTORED`; the CLI never marks code restored.

## Code Graveyard: historical inspection

The source checkout can validate retirement records and recover historical file bytes for inspection. Records describe logical implementations under `knowledge/graveyard/GRAVE-001.json`; Git retains the code. The coordinated **BURY** workflow is described above. These commands neither establish that code is unused nor approve its removal.

```sh
node /path/to/olympus/bin/olympus.mjs graveyard validate
node /path/to/olympus/bin/olympus.mjs graveyard list
node /path/to/olympus/bin/olympus.mjs graveyard search "legacy router"
node /path/to/olympus/bin/olympus.mjs graveyard inspect GRAVE-001
node /path/to/olympus/bin/olympus.mjs graveyard exhume GRAVE-001
node /path/to/olympus/bin/olympus.mjs graveyard exhume GRAVE-001 --export
```

All commands accept `--target /path/to/project` and emit JSON; `--json` is optional. `validate` also accepts a single ID. An absent or empty registry yields `{"status":"OK","records":[]}` for registry-wide validation, listing and searching; an unknown individual ID fails with `Graveyard record not found`. These empty-registry queries do not create the registry or export files. Search is a case-insensitive substring match against names, function descriptions, reasons, successors, paths and symbol labels; queries are limited to 120 characters.

A schema-v1 record for an approved full-file retirement has this shape. Replace the blob placeholder with the actual Git object ID (for example, obtain it with `git rev-parse HEAD:src/legacy-router.mjs` **before removal**) and use real evidence references; this template is not a completed retirement record:

```json
{
  "schemaVersion": 1,
  "id": "GRAVE-001",
  "name": "Legacy request router",
  "originalFunction": "Routed requests using the retired protocol.",
  "reason": "Replaced by the current protocol router after reviewed migration.",
  "evidence": {
    "task": "knowledge/tasks/retire-router.md",
    "audit": "knowledge/audits/retire-router.md",
    "hadesReport": "knowledge/reviews/legacy-router.md"
  },
  "successor": "src/router.mjs",
  "files": [{
    "beforePath": "src/legacy-router.mjs",
    "beforeBlob": "<actual-before-blob-oid>",
    "afterPath": null,
    "afterBlob": null,
    "symbols": ["legacyRoute"]
  }],
  "recoveryRisks": ["Depends on the retired protocol and old dependencies."],
  "restorationSteps": ["Review current interfaces and tests before adapting."]
}
```

Add the record in the same authorized commit as its retirement. Records store before/after **blob IDs**, avoiding a reference to their own future commit SHA. A rename or partial-file removal supplies the resulting `afterPath` and `afterBlob`; symbol labels describe scope but do not prove semantic removal. Related retirements spread over commits can reference other IDs through `relatedIds`. See the [schema implementation](../src/graveyard.mjs) and [temporary Git fixtures](../test/graveyard.test.mjs) for complete examples.

`BURIED` means the unchanged committed record has one reachable introduction with a unique parent, and its before/after paths and blobs match those trees. It does not validate the reasoning or grant authority from referenced reports. Uncommitted records are `PENDING`; malformed records are rejected or reported `INVALID`. Ambiguous introductions, changed records, inaccessible parents/objects or descriptor mismatches return `TRACE_UNAVAILABLE`. Rewritten history can resolve when the record and descriptors still match; squash/rebase/cherry-pick recovery is not guaranteed. Graveyard Git reads pass `--no-lazy-fetch` and disable replacement objects. A Git version supporting that option is required: unsupported versions fail closed, potentially reporting `Git history/object unavailable`, instead of fetching missing history. Upgrade Git if the option is unavailable; recovery still requires the original objects in accessible local history.

`exhume` requires a `BURIED` trace and returns original whole-file bytes as base64 JSON, even for a partial-symbol retirement. `--export` instead creates `.olympus/exhumed/<ID>-<commit-prefix>/files/` and an `EXHUMED.json` receipt, refusing to overwrite a previous export. **EXHUMED** means inspection only; **RESTORED** would require separately reviewed reintegration through the normal engineering workflow. No command restores application files, changes HEAD or marks an implementation restored. Keep local exports out of Git with a project-managed ignore rule and remove them explicitly when no longer needed.

Operations are bounded to 500 records, 64 KiB per record, 32 file descriptors, 20,000 record-history results, 2 MiB per recovered file and 8 MiB total recovered content. Non-export exhumation JSON also has an 8 MiB limit, so base64 expansion can require `--export`. Unsafe paths, symlinks and recognizable sensitive content are rejected; secret detection remains incomplete. `graveyard validate` exits 0 for valid records (including an empty registry), 4 for `PENDING` or `TRACE_UNAVAILABLE`, and 5 for an aggregate `INVALID` result. Operation failures exit 1. List/search can succeed while individual records carry error statuses; inspect each result.

Temporary-repository tests cover retirement traces, renamed and partially changed files, rewritten histories, shallow clones, export collisions, containment and CLI validation exit codes. `npm_config_cache=/tmp/olympus-npm-cache npm pack --dry-run --json` passed and included `src/graveyard.mjs` without producing an archive. Windows/macOS behavior, the Windows promisor-helper fixture and deterministic partial-export-write cleanup failure remain **NOT_VERIFIED**. See the [verification record](../knowledge/stages/03-graveyard/tasks/ST03-T01.md) for actual checks and remaining gaps.


## Verification and current limits

Offline tests use temporary Git repositories for checkpoint reconciliation, retirement tracing, renamed files, symbol-only changes, rewritten history, shallow clones and safe exports. Hades fixture checks cover ordinary references, dynamic imports, convention-based discovery, unknown external use, duplicates and positive removal evidence. They validate the contract and conservative fixture oracle; they do not prove how a live model will classify arbitrary code.

Project and fake-home installer tests cover the new resources, protected `AGENTS.md`, custom settings, update/upgrade behavior and conflicts. Central pins, generated Claude definitions and package structure have dedicated validators. The task evidence records actual executions and outcomes in [continuity](../knowledge/stages/02-continuity/tasks/ST02-T02.md), [Graveyard](../knowledge/stages/03-graveyard/tasks/ST03-T01.md), [retired checkpoint references](../knowledge/stages/03-graveyard/tasks/ST03-T02.md) and [runtime integration](../knowledge/stages/04-hades-integration/tasks/ST04-T01.md). Scope-specific review evidence does not imply final PR approval.

The relevant local commands are:

```sh
node --test test/state-primitives.test.mjs test/context.test.mjs test/graveyard.test.mjs test/hades-fixtures.test.mjs test/st04-installation.test.mjs
python3 -B tools/validate_package.py
```

Tests and structural checks do not establish authenticated CLI integration. Live first-actionable-turn handoffs between Codex, Claude and Pi, actual Pi subagent enforcement, Node 18 execution, and Windows/macOS behavior remain **NOT_VERIFIED** unless the linked evidence records a later real run. Supported runtime minimums and configured tool boundaries are separate from platform test coverage.

Hermes consults bounded Graveyard hints when referenced artifacts change or disappear. Missing or changed artifacts still require reconciliation; a retirement match does not renew tests, Argus approvals or authority. Invalid, unavailable or truncated registry evidence is reported conservatively. Memory is optional metadata in the CLI; neither context recovery nor archaeology requires a resident service.
