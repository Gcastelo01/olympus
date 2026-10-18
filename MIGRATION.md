# Migration summary

- Existing Olympus v1 installation? Retain seven specialist skill directories and eight specialist named agent profiles. Add `.agents/skills/zeus/SKILL.md`; do not add a separate Codex `zeus` subagent TOML.
- Integrate Zeus's bootstrap into the existing `AGENTS.md` and **remove/conflict-resolve** its old large routing policy; preserve project-specific instructions and safety boundaries.
- Merge `.codex/config.toml` deliberately. It is a default-model configuration, not a policy bypass.
- v1.1 → v1.2: add the Claude Code binding (`CLAUDE.md`, `.claude/settings.json`, `.claude/agents/`, `.claude/hooks/`, `tools/olympus_models.py`, `tools/build_claude_agents.py`) and the updated skills. Codex and Pi pins are unchanged.
- Validate with `python3 tools/validate_package.py` after merging. This checks static structure, **not** actual availability of GPT models nor Claude model access, nor backend subagent invocation.
- If you still have the pre-Olympus Forge/Blueprint etc. aliases, first complete the Olympus v1 legacy migration instructions before installing v1.1 or later.
