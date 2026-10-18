# Olympus v1.2 — Installation (Codex CLI and Claude Code)

**8 skill directories** (Zeus + seven specialists) shared by every runtime, plus thin runtime bindings:

- Codex: `.codex/config.toml` + 8 specialist TOMLs (two Atlas profiles). Zeus is the main Codex session.
- Claude Code: `CLAUDE.md` + `.claude/settings.json` + 9 agent files (`zeus` as main session, 8 specialists) + the write-scope hook.
- Pi: 8 specialist profiles in `.agents/agents/`; the root model is selected in Pi.

Both Codex and Claude Code can be used on the same repository, even by different people. Nothing in one binding interferes with the other.

## Install in a *new* repository

```bash
unzip -l olympus-harness-v1.2.zip      # preview paths first
unzip olympus-harness-v1.2.zip -d .
cp AGENTS.template.md AGENTS.md        # only if AGENTS.md does not exist
python3 tools/validate_package.py
```

### Codex CLI

```bash
codex                                   # from the repo root, in a trusted project
```

Trusted-project `.codex/config.toml` sets the root model to **gpt-6-luna / medium**. Named specialists under `.codex/agents/*.toml` keep their own pins.

### Claude Code

```bash
claude --agent zeus                     # from the repo root; accept the workspace trust prompt
```

**Launch with `--agent zeus`.** In our live test (Claude Code 2.1.302) only the CLI flag applied *both* the Haiku pin and the specialist allowlist to the main session; with just the `agent` key in settings, the session took Zeus's prompt but kept the default model and listed every agent type. The settings key is kept as a fallback. A shell alias (`alias olympus='claude --agent zeus'`) helps.

- `CLAUDE.md` imports `AGENTS.md`, so both runtimes read the same policy.
- `claude --agent zeus` makes the main session take the `zeus` agent's prompt, tool allowlist and model (**claude-haiku-5-5 / medium**). `.claude/settings.json` also sets `"agent": "zeus"` as a fallback.
- Zeus's tools are `Agent(<8 specialists>)`, `Read`, `Grep`, `Glob`, `Bash`. It cannot edit files and can dispatch **only** the eight named specialists — no built-in agent can be substituted.
- Specialists have no Agent tool, so they cannot spawn each other; they return handoffs to Zeus, as in Codex.
- Read-only Git (`status`, `diff`, `log`, `show`, `rev-parse`, `ls-files`) is pre-allowed so Zeus and Argus can gather evidence; `git commit` and `git push` always ask; force-push and `git reset --hard` are denied.
- Add your project's test/build commands to `permissions.allow` (e.g. `"Bash(npm test:*)"`, in `.claude/settings.local.json` if personal). Otherwise each run asks, and in unattended/headless runs specialists will return `BLOCKED`, which is the correct behavior.
- Check with `/agents` (definitions loaded), `/model` (session model) and `/context` (CLAUDE.md + AGENTS.md loaded).
- To run Claude Code **without** Zeus for one session, start it with `claude --agent <other-agent>` (the CLI flag overrides the setting).

## Upgrade from Olympus v1.1

v1.2 adds only new files for Claude Code and edits the skills' *execution profile* sections to list both runtimes. Codex and Pi pins are unchanged.

1. **Do not overwrite** existing `AGENTS.md`, `CLAUDE.md`, `.codex/config.toml` or `.claude/settings.json`. Merge them using `AGENTS.integration.md`.
2. Copy `.claude/agents/`, `.claude/hooks/`, `tools/olympus_models.py`, `tools/build_claude_agents.py` and the updated `.agents/skills/`.
3. If the project already has a `CLAUDE.md`, add the line `@AGENTS.md` at its top instead of replacing it.

## Changing a model pin

Edit `tools/olympus_models.py`, run `python3 tools/build_claude_agents.py`, then update the matching `.codex/agents/*.toml` and `.agents/agents/*.md` by hand and run `python3 tools/validate_package.py`. The validator fails if Codex, Pi and Claude pins disagree with the shared table.

## Everyday usage (same prompts on both runtimes)

- `Corrija este bug, siga Olympus, rode os testes e audite antes de concluir.`
- `Planeje esta mudança com Athena/Moirai conforme necessidade. Não implemente.`
- `Aegis: audite o fluxo de autenticação. Sem correções.`
- `Atlas em modo RELEASE: avalie a prontidão. Sem deploy.`

Codex: `/skills`, `/subagents`. Claude Code: `/agents`; an `@agent-<name>` mention forces a specific specialist. Loading a skill inline does **not** select the named model in either runtime.

## Operational caveats

- Project config is applied only in **trusted** projects on both runtimes; CLI flags, local settings and managed (organization) settings can override it. Confirm the actual selected model.
- `AGENTS.md`/`CLAUDE.md` are project guidance, not a security boundary. Privileges come from the runtime's sandbox, permission and approval settings. The Claude Code write-scope hook only covers file-editing tools; shell commands are still governed by permissions. Do not weaken sandboxing to make Olympus work.
- If the provider/account does not support a pinned model (or an effort level for that model), stop and report it rather than silently switching models.
- Frontmatter hooks (the write-scope guard) run **only after the folder is trusted**; in an untrusted folder Claude Code skips them silently in headless mode. Open the repo once interactively and accept the trust prompt.
- These files were structurally validated offline and smoke-tested live on Claude Code 2.1.302 (LOCAL route Zeus → Hephaestus → Argus with no commit; write-scope guard blocking Aegis outside `knowledge/security/`); Codex routing and the full scenario suite must still be verified with your runtime versions and credentials (see `ZEUS-EVALUATION.md`).
