# OLYMPUS — Engineering harness v1.2 (Zeus Orchestration, dual runtime)

> Athena conceives. Moirai weaves. Hephaestus builds. Argus watches. Orpheus explains. Aegis protects. Atlas sustains. **Zeus coordinates.**

Eight roles: **one root coordinator, seven specialist skills**. The Atlas specialist has two runtime profiles (`atlas` and `atlas-critical`). Product discovery and business requirements stay outside the harness.

v1.2 runs the **same skills** on **Codex CLI** and **Claude Code** (Pi remains supported). Only the thin runtime bindings differ; the methodology lives once, in `.agents/skills/`.

| Role | Codex CLI | Claude Code | Effort | Ownership |
|---|---|---|---|---|
| **Zeus** (root only) | `gpt-6-luna` | `claude-haiku-5-5` | medium | lean orchestration and handoffs |
| Athena | `gpt-6-astra` | `claude-opus-5-5` | high | architecture |
| Moirai | `gpt-6.1-sol` | `claude-sonnet-5-5` | medium | staged technical planning |
| Hephaestus | `gpt-6-luna` | `claude-haiku-5-5` | low | implementation and verification |
| Argus | `gpt-6.1-sol` | `claude-sonnet-5-5` | high | independent review |
| Orpheus | `gpt-6.1-sol` | `claude-sonnet-5-5` | medium | documentation |
| Aegis | `gpt-6-astra` | `claude-opus-5-5` | high | security assessments |
| Atlas | `gpt-6.1-sol` | `claude-sonnet-5-5` | medium | routine operational consultation |
| Atlas Critical | `gpt-6-astra` | `claude-opus-5-5` | high | critical operational consultation |

**Tier mapping:** Luna → Haiku (economical), Sol → Sonnet (balanced), Astra → Opus (deepest). Effort levels are unchanged. The single source of truth for pins is `tools/olympus_models.py`.

## Package layout

| Path | Used by | Purpose |
|---|---|---|
| `.agents/skills/*/SKILL.md` | all runtimes | the methodology (Zeus + 7 specialists) |
| `AGENTS.md` (from `AGENTS.template.md`) | all runtimes | project policy + Zeus bootstrap |
| `.codex/config.toml`, `.codex/agents/*.toml` | Codex | root model + 8 named specialists |
| `CLAUDE.md` | Claude Code | imports `AGENTS.md`, adds the Claude binding |
| `.claude/settings.json` | Claude Code | fallback `agent: zeus`; read-only Git allowed, commit/push ask, force denied |
| `.claude/agents/*.md` | Claude Code | `zeus` (main session) + 8 named specialists |
| `.claude/hooks/olympus_guard.py` | Claude Code | per-role write-scope guard for file-editing tools |
| `.agents/agents/*.md` | Pi | 8 named specialists |

**Do not** create a spawnable Zeus specialist: in Codex the main session is Zeus; in Claude Code `zeus.md` is used only as the main-session agent. Project settings and account access determine whether model pinning succeeds.

See `AGENTS.template.md` for bootstrapping, `ENGINEERING-PROTOCOL.md` for detailed boundaries, `AGENTS.integration.md` for migration, `INSTALL.md` for installation on each runtime and `ZEUS-EVALUATION.md` for routing tests.
