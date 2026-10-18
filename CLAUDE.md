@AGENTS.md

## Claude Code runtime binding (Olympus v1.2)

- The main session runs as the `zeus` agent: launch with `claude --agent zeus` (recommended; `.claude/settings.json` sets `"agent": "zeus"` as fallback). Its model and effort are pinned in `.claude/agents/zeus.md`.
- Specialists are the subagents in `.claude/agents/`. They read the same skills as Codex and Pi (`.agents/skills/<role>/SKILL.md`); there is no Claude-only copy of the methodology.
- Pins and write scopes come from `tools/olympus_models.py` and `tools/build_claude_agents.py`. Regenerate the agent files after changing a pin; do not hand-edit models in `.claude/agents/`.
- `.claude/hooks/olympus_guard.py` limits file-editing tools to each role's write scope. It is a guardrail against mistakes, not a sandbox.
