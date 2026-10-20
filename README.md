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

> Runtime configuration and guardrails are not substitutes for operating-system sandboxing. Review repository instructions before trusting execution.
