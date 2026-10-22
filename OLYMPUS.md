# OLYMPUS — Engineering harness v1.3 (Zeus coordination across Codex CLI, Claude Code, and Pi)

> Athena conceives. Moirai weaves. Hephaestus builds. Argus watches. Orpheus explains. Aegis protects. Atlas sustains. **Zeus coordinates.**

Nine roles: **one root coordinator and eight specialist roles**. Hermes is a shared continuity skill, not an agent; Hades is a read-only archaeology specialist. Atlas has two runtime profiles (`atlas` and `atlas-critical`). Product discovery and business requirements stay outside the harness.

v1.3 runs shared skills on **Codex CLI**, **Claude Code**, and **Pi**. Runtime bindings select pinned profiles; the methodology lives in `.agents/skills/`.

| Role | Codex CLI | Claude Code | Pi | Effort | Ownership |
|---|---|---|---|---|---|
| **Zeus** (root only) | `gpt-6-luna` | `claude-haiku-5-5` | configured in Pi | medium | lean orchestration and handoffs |
| Hermes (shared skill) | n/a | n/a | n/a | n/a | checkpoint continuity and reconciliation; never an agent |
| Athena | `gpt-6-astra` | `claude-opus-5-5` | `openai/gpt-6-astra` | high | architecture |
| Moirai | `gpt-6.1-sol` | `claude-sonnet-5-5` | `openai/gpt-6.1-sol` | medium | staged technical planning |
| Hephaestus | `gpt-6-luna` | `claude-haiku-5-5` | `openai/gpt-6-luna` | low | implementation and verification |
| Argus | `gpt-6.1-sol` | `claude-sonnet-5-5` | `openai/gpt-6.1-sol` | high | independent review |
| Orpheus | `gpt-6.1-sol` | `claude-sonnet-5-5` | `openai/gpt-6.1-sol` | medium | documentation |
| Aegis | `gpt-6-astra` | `claude-opus-5-5` | `openai/gpt-6-astra` | high | security assessments |
| Atlas | `gpt-6.1-sol` | `claude-sonnet-5-5` | `openai/gpt-6.1-sol` | medium | routine operational consultation |
| Atlas Critical | `gpt-6-astra` | `claude-opus-5-5` | `openai/gpt-6-astra` | high | critical operational consultation |
| Hades (read-only) | `gpt-6-astra` | `claude-opus-5-5` | `openai/gpt-6-astra` | high | dead-code investigation and historical recovery planning |

**Tier mapping:** Luna → Haiku (economical), Sol → Sonnet (balanced), Astra → Opus (deepest). Effort levels are unchanged. The single source of truth for pins is `tools/olympus_models.py`.

## Package layout

| Path | Used by | Purpose |
|---|---|---|
| `.agents/skills/*/SKILL.md` | all runtimes | Zeus, Hermes and 8 specialist roles |
| `AGENTS.md` (from `AGENTS.template.md`) | all runtimes | project policy + Zeus bootstrap |
| `.codex/config.toml`, `.codex/agents/*.toml` | Codex | root model + 9 pinned specialist profiles (Atlas has two) |
| `CLAUDE.md` | Claude Code | imports `AGENTS.md`, adds the Claude binding |
| `.claude/settings.json` | Claude Code | fallback `agent: zeus`; read-only Git allowed, commit/push ask, force denied |
| `.claude/agents/*.md` | Claude Code | `zeus` (main session) + 9 pinned specialist profiles (Atlas has two) |
| `.claude/hooks/olympus_guard.py` | Claude Code | per-role write-scope guard for file-editing tools |
| `.agents/agents/*.md` | Pi | 9 pinned specialist profiles (Atlas has two) |

**Do not** create a spawnable Zeus specialist: in Codex the main session is Zeus; in Claude Code `zeus.md` is used only as the main-session agent. Project settings and account access determine whether model pinning succeeds.

See `AGENTS.template.md` for bootstrapping, `ENGINEERING-PROTOCOL.md` for detailed boundaries, `AGENTS.integration.md` for migration, `INSTALL.md` for installation on each runtime and `ZEUS-EVALUATION.md` for routing tests.

Hermes exposes `olympus context save`, `discover`, `inspect`, `load` and `prune`. It does not launch runtimes or transfer native session history. Project-scope installation gives Codex root Zeus guidance through `.codex/config.toml` when the project is trusted; user-scope installation does not configure the root session. Claude's user-level Zeus profile works only when explicitly selected, and Pi uses trusted project guidance. Hades may report removal candidates but cannot edit, remove, restore or approve code. `knowledge/graveyard/` records historical implementations, and `olympus graveyard exhume` writes only an exclusive inspection export when explicitly requested; it never restores application files.
