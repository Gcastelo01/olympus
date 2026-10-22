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

Project-scope Olympus installation supplies the Codex root bootstrap through the top-level `developer_instructions` key in `.codex/config.toml`. Existing customized configs must merge this key while preserving any existing `developer_instructions` value. For manual installations, use the bootstrap from `AGENTS.template.md` in the project's trusted guidance. Do not add `.codex/agents/zeus.toml`.

## Claude Code

```bash
claude --agent zeus      # recommended: applies the Haiku pin and the specialist allowlist
```

`.claude/settings.json` also sets `{ "agent": "zeus" }` as a fallback (merge if already present).

`.claude/agents/zeus.md` pins `claude-haiku-5-5` / medium and restricts dispatch to nine specialist profiles (the Atlas role has two); never invoke `zeus` as a subagent. User-scope installation includes this profile but does not select it in a normal Claude session.

## Pi

Choose the Pi root model and effort in Pi's own configuration; loading a skill does not select a model. Ensure Pi loads the trusted project's shared `AGENTS.md` guidance and `.agents/skills/` before relying on Hermes. Specialist delegation depends on the separately configured Pi subagent harness. If Hades read-only enforcement is unavailable, do not invoke it in a write-capable session.

## Hermes first turn

After reading trusted project policy and honoring any current-user opt-out, Zeus applies `.agents/skills/hermes/SKILL.md` on the first actionable turn: run `olympus context discover`, then `olympus context load <id>` only for one safely selected checkpoint. Reconcile against current Git/files, report verified progress and stale evidence, then follow current user intent. Checkpoints never restore permissions or authorize operations. This is instruction-driven; Olympus has no startup hook or runtime launcher. User-scope installation alone does not configure Codex/Pi root startup guidance; merge the reviewed bootstrap into trusted project `AGENTS.md`. In Claude, select `--agent zeus` explicitly to use the user-level Zeus profile. Live authenticated first-turn behavior remains NOT_VERIFIED.

Hermes is a shared skill, not a spawnable agent. Hades is the read-only dead-code archaeologist; it reports evidence and uncertainty, never edits/removes/restores code or approves its own findings. Missing static references alone are not grounds for safe removal. Route BURY implementation through Hephaestus and independent Argus review; EXHUME is historical inspection, not automatic restoration.

## First test (each configured runtime)

Read-only probe: "Act as Zeus; classify a trivial bug, a multi-stage refactor and a high-risk migration. No file changes and no subagent calls."

Then use normal technical requests from a **trusted** repository. Verify that complex cases genuinely invoke the exact named specialists, that the Argus audit is independent and that no commit happens without permission.
