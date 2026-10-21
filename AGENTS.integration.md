# Olympus v1 / v1.1 / v1.2 → v1.3: Integrating Zeus and Hermes with an existing AGENTS.md

**Do not blindly replace a project's AGENTS.md.** Back it up and preserve its repository-specific restrictions, build instructions, escalation and approvals.

1. Inspect the current `AGENTS.md` and `.codex/config.toml` before extraction/replacement. In an older Olympus v1 `AGENTS.md`, remove the repeated large routing matrix (LOCAL/PLANNED/ARCHITECTURAL) and replace it with **one** Zeus bootstrap paragraph copied from `AGENTS.template.md`. Keep non-negotiable safety rules and project-local instructions.
2. Zeus skill `.agents/skills/zeus/SKILL.md` is now the **single routing methodology source**. Do not leave old text saying "there is no coordinator skill" or making the old matrix authoritative over Zeus.
3. Merge the **top-level** `model = "gpt-6-luna"`, `model_reasoning_effort = "medium"` and `[agents]` settings from `.codex/config.toml`. Do not overwrite existing MCP, provider, approval, sandbox, profiles or other config sections. Codex project config applies only when the repo is trusted. CLI flags or higher-precedence settings may override the default.
4. Keep existing specialist pins and definitions unchanged. v1.3 adds only the centrally pinned read-only Hades specialist; Zeus remains the root session, not an additional `.codex/agents/zeus.toml` child. For Pi choose its default root model explicitly; do not expect skill activation to switch it.
5. Verify only one discoverable `zeus` skill and only one `AGENTS.md` routing authority. Remove older/conflicting Olympia/Olympus coordinator policies only after review. No automatic destructive cleanup is provided.
6. **Claude Code:** if the project has no `CLAUDE.md`, copy the packaged one. If it already has one, add `@AGENTS.md` as its first line and append the *Claude Code runtime binding* section. Merge only the `agent` key and the `permissions.ask`/`permissions.deny` entries into an existing `.claude/settings.json`; keep its other permissions, hooks, MCP servers and env. Copy `.claude/agents/` and `.claude/hooks/` unchanged.
7. Restart the Codex or Claude Code session and test the `zeus` bootstrap with a read-only routing probe before enabling writes or commits.

8. Hermes continuity guidance is active only after the trusted Zeus→Hermes bootstrap is present in the merged `AGENTS.md` (or the existing Claude import path / selected Pi shared guidance). The first actionable turn performs `olympus context discover` and, when safe, `olympus context load <id>`. This is instruction-driven, not a process-start hook. Do not overwrite protected `AGENTS.md`, Claude settings, or custom Pi configuration; merge reviewed guidance explicitly. If Hades tool restriction enforcement cannot be established in the installed runtime, use an actual read-only runtime mode or treat the profile as unavailable for write-capable sessions.

## Minimal merge snippet for existing AGENTS.md

```markdown
## Olympus root session
You are Zeus, the root coordinator. Read and apply `.agents/skills/zeus/SKILL.md` before routing engineering work. Use the runtime's named model-pinned subagents (`.codex/agents/` in Codex, `.claude/agents/` in Claude Code); do not substitute other models. Follow this repository's safety, approvals and tests. Zeus coordinates but does not implement or self-audit. Do not load all specialists for a trivial task.
```

## Smoke test (no writes)

```text
Act as Zeus. Read your Zeus skill. Without modifying files or launching agents,
classify these three requests and state the minimal agents + stop point:
1. Fix a typo in a comment.
2. Implement a two-phase feature using an already approved design.
3. Assess the risk of a destructive PostgreSQL migration.
Show which evidence would change each routing choice. Do not implement.
```
