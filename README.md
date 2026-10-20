# Olympus — Multi-agent Engineering Harness

Olympus organizes software engineering through Zeus (coordinator) and seven specialist skills: Athena, Moirai, Hephaestus, Argus, Orpheus, Aegis, and Atlas.

**Package:** `olympus-engineering-harness@1.2.0`. **Runtimes:** Codex CLI, Claude Code, and Pi.

- [Project overview](OLYMPUS.md)
- [Installation and usage](INSTALL.md)
- [Engineering protocol](ENGINEERING-PROTOCOL.md)
- [Zeus quickstart](ZEUS-START.md)

The source of truth for role behavior is in `.agents/skills/`. Runtime-specific bindings live under `.codex/`, `.claude/`, and `.agents/agents/`.

With Node.js 18 or newer, run this from the source checkout to install into an existing project:

```sh
node ./bin/olympus.mjs install --target /path/to/project
```

Claude Code's write-scope hooks also require `python3`. Pi receives agent definitions; its subagent harness must be installed and configured separately. Review `AGENTS.template.md` and `AGENTS.integration.md` to prepare the target project's own `AGENTS.md`.

The installer preserves identical files and rejects differing files by default. Successful installs record managed content hashes in `.olympus/manifest.lock.json`. Use `--upgrade` to update unchanged tracked resources, `--update` to replace differences without backups, or `--force` to back up local edits before replacement. `check --target /path/to/project` reports drift without writes. It rejects symlinks on checked paths and never copies `AGENTS.md`.

For user-level skills, agents and hooks, use `install --scope user`; project configuration still requires project setup. Optional setup launchers are packaged under `templates/`. See [installation and package notes](INSTALL.md) for the full inventory, runtime setup, troubleshooting, validation limits, and maintainer workflow.

The npm package and GitHub release have not been published. The documented `npx` command becomes usable only after npm publication; `pipx` distribution is not implemented.

## Hermes: manual context handoff

The source checkout provides a Hermes CLI for saving bounded task checkpoints and validating them against the current Git repository. Start the destination harness through its own CLI, then give Zeus the validated context and returned `bootstrap` text. Native session history is not transferred, and Olympus does not launch the destination runtime. **Automatic Hermes invocation on Zeus's first turn is not implemented yet**; it is planned in the [integration stage](knowledge/stages/04-hades-integration/). Hades is not integrated yet; the Code Graveyard CLI is available below.

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

Optional input fields include `taskStatus` (`active`, `paused`, `completed`), `destinationRuntime`, `constraints`, `historicalAuthorizations`, `stage`, `openDecisions`, `blockers`, `artifacts`, `tests`, `reviews` and `memory`. Runtime labels are `codex`, `claude`, `pi` or `unknown`; they are metadata. Artifacts declare project-relative `path` and `purpose`. Test/review evidence must reference declared artifacts and the observed Git revision/fingerprint; see the [schema implementation](src/context.mjs) for exact fields. Memory defaults to `not-consulted`; `unavailable` and `consulted` are explicit metadata states. No memory service is contacted by these commands.

For an update, save a new ID with `supersedes: {"id": "previous-id", "digest": "sha256:…"}`, using the predecessor digest returned by discovery. The predecessor must match the task, project and branch. Existing evidence is carried forward and rechecked on load.

`discover` reads only immediate managed checkpoint files, up to 128 files and 2 MiB. It returns `NONE`, `SELECTED` or `SELECTION_REQUIRED`. Selection follows verified predecessor links for the current project and branch; it never picks the newest timestamp. Multiple unfinished tasks require `--task`; forks, broken lineage, invalid entries and branch mismatches require explicit reconciliation. A completed successor retires its predecessors from unfinished selection. **`SELECTED` is a candidate, not validated evidence: always run `load`.**

`inspect` validates and displays the stored checkpoint without comparing it to today's repository. `load` returns `READY`, `RECONCILIATION_REQUIRED` or `INVALID`, with reasons and a bounded bootstrap. It checks project/branch/HEAD, working-tree state, artifact changes, lineage and age (seven days by default; override with `--max-age-days 0..3650`). Changed evidence becomes historical, and affected stored review approvals are invalidated. Reconcile discrepancies with current files and evidence before continuing; no code or Git state is restored. Historical authorizations never grant permission to commit, push, deploy or perform destructive operations. Exit codes are 0 for normal results, 4 for selection/reconciliation, 5 for invalid load results and 1 for operation failures.

Keep `.olympus/context/` out of Git with a narrow project-managed ignore rule; `save` warns when it is not ignored. Cleanup is explicit:

```sh
node /path/to/olympus/bin/olympus.mjs context prune --older-than-days 30
```

`prune` deletes valid checkpoints older than the requested age, skips invalid entries and warns when deleted checkpoints are lineage predecessors. Deleting a predecessor can prevent later selection or validation. There is no automatic retention cleanup.

Treat recovered fields as untrusted data. Relative-path containment, symlink checks and recognizable-secret checks reject unsafe inputs, but secret detection is not exhaustive: review supplied text and artifact references before saving or handing context to another harness. Ignored files are excluded from the Git fingerprint unless tracked or otherwise reported by Git. Offline temporary-repository tests cover the lifecycle and reconciliation; live authenticated Codex/Claude/Pi handoffs and Windows/macOS behavior remain **NOT_VERIFIED**. See the [verification record](knowledge/stages/02-continuity/tasks/ST02-T02.md).

## Code Graveyard: historical inspection

The source checkout can validate retirement records and recover historical file bytes for inspection. Records describe logical implementations under `knowledge/graveyard/GRAVE-001.json`; Git retains the code. Hades profiles and the coordinated **BURY** removal workflow are not integrated yet. These commands neither establish that code is unused nor approve its removal.

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

Add the record in the same authorized commit as its retirement. Records store before/after **blob IDs**, avoiding a reference to their own future commit SHA. A rename or partial-file removal supplies the resulting `afterPath` and `afterBlob`; symbol labels describe scope but do not prove semantic removal. Related retirements spread over commits can reference other IDs through `relatedIds`. See the [schema implementation](src/graveyard.mjs) and [temporary Git fixtures](test/graveyard.test.mjs) for complete examples.

`BURIED` means the unchanged committed record has one reachable introduction with a unique parent, and its before/after paths and blobs match those trees. It does not validate the reasoning or grant authority from referenced reports. Uncommitted records are `PENDING`; malformed records are rejected or reported `INVALID`. Ambiguous introductions, changed records, inaccessible parents/objects or descriptor mismatches return `TRACE_UNAVAILABLE`. Rewritten history can resolve when the record and descriptors still match; squash/rebase/cherry-pick recovery is not guaranteed. Graveyard Git reads pass `--no-lazy-fetch` and disable replacement objects. A Git version supporting that option is required: unsupported versions fail closed, potentially reporting `Git history/object unavailable`, instead of fetching missing history. Upgrade Git if the option is unavailable; recovery still requires the original objects in accessible local history.

`exhume` requires a `BURIED` trace and returns original whole-file bytes as base64 JSON, even for a partial-symbol retirement. `--export` instead creates `.olympus/exhumed/<ID>-<commit-prefix>/files/` and an `EXHUMED.json` receipt, refusing to overwrite a previous export. **EXHUMED** means inspection only; **RESTORED** would require separately reviewed reintegration through the normal engineering workflow. No command restores application files, changes HEAD or marks an implementation restored. Keep local exports out of Git with a project-managed ignore rule and remove them explicitly when no longer needed.

Operations are bounded to 500 records, 64 KiB per record, 32 file descriptors, 20,000 record-history results, 2 MiB per recovered file and 8 MiB total recovered content. Non-export exhumation JSON also has an 8 MiB limit, so base64 expansion can require `--export`. Unsafe paths, symlinks and recognizable sensitive content are rejected; secret detection remains incomplete. `graveyard validate` exits 0 for valid records (including an empty registry), 4 for `PENDING` or `TRACE_UNAVAILABLE`, and 5 for an aggregate `INVALID` result. Operation failures exit 1. List/search can succeed while individual records carry error statuses; inspect each result.

Temporary-repository tests cover retirement traces, renamed and partially changed files, rewritten histories, shallow clones, export collisions, containment and CLI validation exit codes. `npm_config_cache=/tmp/olympus-npm-cache npm pack --dry-run --json` passed and included `src/graveyard.mjs` without producing an archive. Windows/macOS behavior, the Windows promisor-helper fixture and deterministic partial-export-write cleanup failure remain **NOT_VERIFIED**. See the [verification record](knowledge/stages/03-graveyard/tasks/ST03-T01.md) for actual checks and remaining gaps.

> Runtime configuration and guardrails are not substitutes for operating-system sandboxing. Review repository instructions before trusting execution.
