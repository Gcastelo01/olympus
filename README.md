# Olympus — Multi-agent Engineering Harness

Olympus organizes software engineering through Zeus (coordinator) and seven specialist skills: Athena, Moirai, Hephaestus, Argus, Orpheus, Aegis, and Atlas.

**Version:** 1.2. **Runtimes:** Codex CLI, Claude Code, and Pi.

- [Project overview](OLYMPUS.md)
- [Installation and usage](INSTALL.md)
- [Engineering protocol](ENGINEERING-PROTOCOL.md)
- [Zeus quickstart](ZEUS-START.md)

The source of truth for role behavior is in `.agents/skills/`. Runtime-specific bindings live under `.codex/`, `.claude/`, and `.agents/agents/`.

> Runtime configuration and guardrails are not substitutes for operating-system sandboxing. Review repository instructions before trusting execution.
