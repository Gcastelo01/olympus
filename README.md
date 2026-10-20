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

The source checkout provides a Hermes CLI for saving bounded task checkpoints and validating them against the current Git repository. Start the destination harness through its own CLI, then give Zeus the validated context and returned `bootstrap` text. Native session history is not transferred, and Olympus does not launch the destination runtime. **Automatic Hermes invocation on Zeus's first turn is not implemented yet**; it is planned in the [integration stage](knowledge/stages/04-hades-integration/). Hades and the Code Graveyard are also not implemented yet.

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

> Runtime configuration and guardrails are not substitutes for operating-system sandboxing. Review repository instructions before trusting execution.
