# Olympus v1.2 — Installation (Codex CLI, Claude Code, and Pi)

## Prerequisites and distribution status

The current npm package identity is `olympus-engineering-harness@1.2.0`; its executable is `olympus`. The installer requires **Node.js 18 or newer**, uses Node's standard library, and needs no dependency installation when run from this source checkout. Install your chosen agent runtime separately, with access to its configured models. Claude Code's write-scope hooks invoke **`python3`**, which must be available on `PATH`; the supporting maintenance tools also use Python.

The npm package and GitHub release have not been published. Local checkout installation is the current path. Publishing to npm and creating a GitHub release are separate maintainer operations. There is no Python package or `pipx` installer.

Contents: [project installation](#install-into-a-project), [package contents](#package-maintenance), [manual source archive](#manual-install-from-a-source-archive), [Codex](#codex-cli), [Claude Code](#claude-code), [Pi](#pi), [upgrades](#upgrade-from-olympus-v11), [validation](#validation-and-publication), [troubleshooting](#troubleshooting).

## Install into a project

The `.agents/skills/` directory is the canonical source for skill behavior. Runtime bindings and tools are installed from the explicit `package-manifest.json` allowlist; local databases, environment files, and unrelated repository contents are not packaged.

From a checked-out Olympus repository, run:

```sh
node ./bin/olympus.mjs install --target /path/to/project
```

The target directory must already exist. Use an absolute path or a path relative to your current working directory; quote paths containing spaces. `--target` is required. Installation expands the complete resource list and checks every planned destination before writing:

- Existing files with identical bytes are preserved. Missing files and their parent directories are created.
- Any differing file aborts the entire preflight with the conflicting paths, before any installation writes. Existing directories where files are expected, or files where parent directories are needed, also cause failure.
- Symlinks in the target directory's ancestry, planned destination paths, or source resources are rejected. Unrelated destination paths are not scanned.
- `AGENTS.md` is protected and never copied. Review `AGENTS.template.md` and `AGENTS.integration.md`, then create or merge the target project's instructions yourself. In particular, `CLAUDE.md` imports that project-owned `AGENTS.md`.

There is no `--force`, merge, uninstall, or upgrade mode. To resolve a collision, review and back up the existing content, then manually merge or move the conflicting file before retrying. A repeat install preserves unchanged files.

Preflight is not a filesystem transaction. A later copy, permission, disk-space, or concurrent filesystem failure can leave some newly copied files behind; there is no rollback. Inspect the target after such a failure. The CLI reports `Installed <path>` and `Preserved identical <path>` after success, exits with code 1 on installation failure, and uses code 2 for missing or invalid CLI arguments.

The package exposes the same installer as `olympus install --target /path/to/project`. **Only after npm publication under the current name and version**, the equivalent command will be:

```sh
npx --yes olympus-engineering-harness@1.2.0 install --target /path/to/project
```

Before publication, maintainers must confirm ownership/availability of the npm name and choose the license. The manifest's current identity does not establish registry availability or permission to publish.

This package installs Codex and Claude bindings and Pi agent definitions. A Pi manifest does not install or configure the Pi subagent harness itself.

## Package maintenance

Two allowlists serve different purposes:

| File | Controls |
|---|---|
| `package.json` → `files` | Contents offered to npm's tarball packer, including the CLI, installer implementation, manifest, `README.md`, `INSTALL.md`, runtime bindings, and support files. npm also applies its own packaging rules; inspect the resulting inventory. |
| `package-manifest.json` → `resources` | Files/directories expanded recursively and copied into the target project by the installer. |
| `package-manifest.json` → `protected` | Paths forbidden in the copy plan; currently `AGENTS.md`. |

The current installation resources are:

- `.agents/skills/`, `.agents/agents/`, `.codex/agents/`, `.codex/config.toml`.
- `.claude/agents/`, `.claude/hooks/olympus_guard.py`, `.claude/settings.json`.
- `AGENTS.template.md`, `AGENTS.integration.md`, `CLAUDE.md`, `ENGINEERING-PROTOCOL.md`, `MIGRATION.md`, `OLYMPUS.md`, `ZEUS-EVALUATION.md`, `ZEUS-START.md`.
- `tools/build_claude_agents.py`, `tools/migrate_legacy.py`, `tools/olympus_models.py`, `tools/validate_package.py`.

The npm tarball contains the installer and installation manual, but the target copy plan omits `bin/`, `src/`, both package manifests, `README.md`, and `INSTALL.md`. In particular, **the evaluation document and validator are copied into the target**. However, `tools/validate_package.py` requires `INSTALL.md`, so the installed resource set alone cannot satisfy that validator. Run it in the complete source checkout as described below. Update both allowlists deliberately when adding distributable resources.

**8 skill directories** (Zeus + seven specialists) shared by every runtime, plus thin runtime bindings:

- Codex: `.codex/config.toml` + 8 specialist TOMLs (two Atlas profiles). Zeus is the main Codex session.
- Claude Code: `CLAUDE.md` + `.claude/settings.json` + 9 agent files (`zeus` as main session, 8 specialists) + the write-scope hook.
- Pi: 8 specialist profiles in `.agents/agents/`; the root model is selected in Pi.

Both Codex and Claude Code can be used on the same repository, even by different people. Nothing in one binding interferes with the other.

## Manual install from a source archive

The following is the older manual workflow for a complete source ZIP you already have; the example filename does not imply a downloadable GitHub release. Inspect its contents and extract into a temporary directory first. A ZIP may contain an enclosing directory: locate the Olympus root before running tools. Prefer the Node installer above to copy into an existing project with preflight checks.

```bash
unzip -l olympus-harness-v1.2.zip      # preview paths first
unzip olympus-harness-v1.2.zip -d /path/to/empty/staging-directory
```

For a new repository, review the staged resources before copying them. For an existing repository, merge project configuration deliberately using `AGENTS.integration.md`. Extracting or copying by hand does not provide the installer's collision checks. Create `AGENTS.md` from the reviewed template only when the project has no such file; otherwise merge its existing policy. Run source validation from the complete extracted Olympus root, not from the installed target subset.

### Codex CLI

```bash
codex                                   # from the repo root, in a trusted project
```

Trusted-project `.codex/config.toml` sets the root model to **gpt-6-luna / medium**. Named specialists under `.codex/agents/*.toml` keep their own pins.

### Claude Code

```bash
claude --agent zeus                     # from the repo root; accept the workspace trust prompt
```

**Launch with `--agent zeus`.** In our live test (Claude Code 2.1.302) only the CLI flag applied *both* the Haiku pin and the specialist allowlist to the main session; with just the `agent` key in settings, the session took Zeus's prompt but kept the default model and listed every agent type. The settings key is kept as a fallback. An optional shell alias is `alias olympus-claude='claude --agent zeus'`; this keeps the `olympus` name available for the installer executable.

- `CLAUDE.md` imports `AGENTS.md`, so both runtimes read the same policy.
- `claude --agent zeus` makes the main session take the `zeus` agent's prompt, tool allowlist and model (**claude-haiku-5-5 / medium**). `.claude/settings.json` also sets `"agent": "zeus"` as a fallback.
- Zeus's tools are `Agent(<8 specialists>)`, `Read`, `Grep`, `Glob`, `Bash`. It cannot edit files and can dispatch **only** the eight named specialists — no built-in agent can be substituted.
- Specialists have no Agent tool, so they cannot spawn each other; they return handoffs to Zeus, as in Codex.
- Read-only Git (`status`, `diff`, `log`, `show`, `rev-parse`, `ls-files`) is pre-allowed so Zeus and Argus can gather evidence; `git commit` and `git push` always ask; force-push and `git reset --hard` are denied.
- Add your project's test/build commands to `permissions.allow` (e.g. `"Bash(npm test:*)"`, in `.claude/settings.local.json` if personal). Otherwise each run asks, and in unattended/headless runs specialists will return `BLOCKED`, which is the correct behavior.
- Check with `/agents` (definitions loaded), `/model` (session model) and `/context` (CLAUDE.md + AGENTS.md loaded).
- To run Claude Code **without** Zeus for one session, start it with `claude --agent <other-agent>` (the CLI flag overrides the setting).

### Pi

The installer copies `.agents/agents/` and the shared skills. The specialist profiles reference the `@parke.dev/pi-subagent` integration, which must be installed and configured separately in your Pi environment. Copying the profiles does not install or configure that harness, select the root model, or establish a working delegation flow. Follow the profile requirements and verify routing in your own runtime before relying on it.

## Upgrade from Olympus v1.1

For the runtime migration from v1.1, v1.2 adds Claude Code bindings and extends the skills' *execution profile* sections to list both runtimes. The existing upgrade guidance below covers those bindings; the npm installer follows the collision rules described above and does not automatically merge an older installation.

1. **Do not overwrite** existing `AGENTS.md`, `CLAUDE.md`, `.codex/config.toml` or `.claude/settings.json`. Merge them using `AGENTS.integration.md`.
2. Copy `.claude/agents/`, `.claude/hooks/`, `tools/olympus_models.py`, `tools/build_claude_agents.py` and the updated `.agents/skills/`.
3. If the project already has a `CLAUDE.md`, add the line `@AGENTS.md` at its top instead of replacing it.

## Changing a model pin

In the complete source checkout, edit `tools/olympus_models.py`, run `python3 tools/build_claude_agents.py`, then update the matching `.codex/agents/*.toml` and `.agents/agents/*.md` by hand and run `python3 tools/validate_package.py`. The validator fails if Codex, Pi and Claude pins disagree with the shared table. The installed resource subset is insufficient for this source-level validation because it omits `INSTALL.md`.

## Validation and publication

The packaging implementation received an independent Argus **PASS** before these documentation updates. An inventory preview using `npm pack --dry-run --json` listed **57 files**. This preview does not establish successful tarball installation, runtime routing, or registry publication. Packaging tests and an actual installer run have not been performed; these documentation changes do not add validation evidence for them.

Maintainers can inspect the source and tarball inventory from the complete checkout with:

```sh
python3 tools/validate_package.py
npm pack --dry-run --json
```

These commands are provided for future verification; the Python validator was not run as part of this packaging/documentation work. It checks source-package structure and model consistency, not end-to-end installer behavior. The runtime smoke-test evidence recorded under [operational caveats](#operational-caveats) predates this installer and does not validate package installation.

To prepare a release, review the diff and both allowlists, choose the license, confirm the npm name, and verify installation from the actual packed artifact into a disposable existing directory. Check a repeated install and a conflicting destination as part of that verification. Record the results and limitations in release notes. Commit/tag the reviewed version under repository policy, then publish to npm and create the corresponding GitHub release using authenticated maintainer accounts. A local commit, tag, or successful inventory preview does not publish either artifact. There is currently no `pipx` publication path.

## Troubleshooting

| Symptom | Action |
|---|---|
| `Target directory does not exist` | Create or select the intended directory, then repeat the command with explicit `--target`. |
| `Conflicting files found` | Review the listed files; back up and merge or move them before retrying. No files are copied when preflight detects conflicts. |
| A symlink/path error | Use a physical target directory and ordinary files/directories at the planned paths. Review the reported path before changing it. |
| A permission/copy failure | Inspect for a partial installation, correct the filesystem issue, then retry; already identical files are preserved. |
| `python3` unavailable in Claude hooks | Install/configure Python separately so `python3` is on the runtime's `PATH`. |
| Validator fails on missing `INSTALL.md` in a target project | Run the validator from the full Olympus source checkout. Its presence in the copied tools does not make the target subset a complete source package. |
| The future `npx` command cannot resolve the package/version | Use the local-checkout command until that exact npm package/version is published. |
| Pi definitions are present but delegation does not work | Configure the external Pi subagent integration and verify its routing separately. |

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
