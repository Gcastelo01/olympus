# Zeus — quick start

Zeus is the root Olympus coordinator, **not** a spawned expert. The routing methodology lives in `.agents/skills/zeus/SKILL.md` for every runtime.

## Codex CLI

```toml
# .codex/config.toml (merge if already present)
model = "gpt-6-luna"
model_reasoning_effort = "medium"
[agents]
enabled = true
max_concurrent_threads_per_session = 2
```

Add the Zeus bootstrap from `AGENTS.template.md` to your root `AGENTS.md`. Do not add `.codex/agents/zeus.toml`.

## Claude Code

```bash
claude --agent zeus      # recommended: applies the Haiku pin and the specialist allowlist
```

`.claude/settings.json` also sets `{ "agent": "zeus" }` as a fallback (merge if already present).

`.claude/agents/zeus.md` pins `claude-haiku-5-5` / medium and restricts dispatch to the eight specialists. `CLAUDE.md` must import `AGENTS.md` (`@AGENTS.md`). Never invoke `zeus` as a subagent.

## First test (both runtimes)

Read-only probe: "Act as Zeus; classify a trivial bug, a multi-stage refactor and a high-risk migration. No file changes and no subagent calls."

Then use normal technical requests from a **trusted** repository. Verify that complex cases genuinely invoke the exact named specialists, that the Argus audit is independent and that no commit happens without permission.
