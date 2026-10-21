# Olympus — Multi-agent Engineering Harness

Olympus organizes software engineering through Zeus (coordinator) and eight specialist roles: Athena, Moirai, Hephaestus, Argus, Orpheus, Aegis, Atlas, and Hades. Hermes provides a shared continuity procedure for Zeus.

**Package:** `olympus-engineering-harness@1.3.0`. **Runtimes:** Codex CLI, Claude Code, and Pi.

- [Continuity, Hades and Code Graveyard guide](docs/README.md)
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

## Hermes: resume work across harnesses

Start Codex CLI, Claude Code or Pi normally. In a trusted project installed with Olympus project scope, Codex receives root Zeus startup guidance from `.codex/config.toml`; Claude Code and Pi still use their documented project guidance. On the first actionable turn, Zeus applies the shared Hermes skill, discovers a checkpoint and validates it against the current repository before proposing the next action. User-scope installation does not configure Codex's root session. There is no `switch` command or runtime launcher, and opening an idle CLI does not execute Hermes.

Checkpoints preserve bounded task state and references to evidence. They do not transfer native conversation history, restore code, renew review approvals or authorize operations. Save current handoff data before leaving a session; no tool can recover context that was never saved. For manual discovery and reconciliation:

```sh
node /path/to/olympus/bin/olympus.mjs context discover
node /path/to/olympus/bin/olympus.mjs context load <checkpoint-id>
```

The [guide](docs/README.md#hermes-resume-work-across-harnesses) explains checkpoint creation, selection, reconciliation and cleanup. Live authenticated cross-harness sessions remain **NOT_VERIFIED**; first-turn invocation is implemented through agent instructions and depends on the destination runtime loading them.

## Hades: investigate retired and possibly obsolete code

Ask Zeus to route a dead-code investigation to **Hades**, a read-only specialist. Hades distinguishes observed facts, hypotheses and missing evidence; absent static references alone never establish safe removal. Its canonical methodology is shared across Codex, Claude and Pi, with runtime-specific model and tool profiles. Hades does not edit candidates, create retirement records, export files, commit or approve its own findings.

**BURY** sends an approved, bounded removal through Hephaestus, relevant tests and independent Argus review, pairing the retirement with a semantic record in `knowledge/graveyard/`. **EXHUME** resolves that record against accessible Git history and retrieves historical content for inspection; reintegration requires a separate reviewed task.

```sh
node /path/to/olympus/bin/olympus.mjs graveyard list
node /path/to/olympus/bin/olympus.mjs graveyard inspect GRAVE-001
node /path/to/olympus/bin/olympus.mjs graveyard exhume GRAVE-001
```

The [guide](docs/README.md#hades-investigate-before-removing) covers specialist boundaries, BURY, EXHUME, record schemas and recovery limits. Hermes consults these records when checkpoint references disappear or change; a match explains the discrepancy and never restores the implementation.

> Runtime configuration and guardrails are not substitutes for operating-system sandboxing. Review repository instructions before trusting execution.
