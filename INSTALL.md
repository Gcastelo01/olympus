# Olympus v1.3.0 — Installation (Codex CLI, Claude Code, and Pi)

## Prerequisites and distribution status

The current package identity is `olympus-engineering-harness@1.3.0`; its executable is `olympus`. The installer requires **Node.js 18 or newer**, uses Node's standard library, and needs no dependency installation when run from this source checkout. Install your chosen agent runtime separately, with access to its configured models. Claude Code's write-scope hooks invoke **`python3`**, which must be available on `PATH`; the supporting maintenance tools also use Python.

The npm package and GitHub release have not been published. Local checkout installation is the current path. Publishing to npm and creating a GitHub release are separate maintainer operations. There is no Python package or `pipx` installer.

Contents: [project installation](#install-into-a-project), [update modes](#update-modes-and-installation-state), [user installation](#install-for-a-user), [setup launchers](#setup-launchers), [package contents](#package-maintenance), [manual source archive](#manual-install-from-a-source-archive), [Codex](#codex-cli), [Claude Code](#claude-code), [Pi](#pi), [upgrades](#upgrade-from-olympus-v11), [validation](#validation-and-publication), [troubleshooting](#troubleshooting).

## Install into a project

The `.agents/skills/` directory is the canonical source for skill behavior. Runtime bindings and tools are installed from the explicit `package-manifest.json` allowlist; local databases, environment files, and unrelated repository contents are not packaged.

From a checked-out Olympus repository, run:

```sh
node ./bin/olympus.mjs install --target /path/to/project
```

The target directory must already exist. Use an absolute path or a path relative to your current working directory; quote paths containing spaces. `--target` is required for project scope. Installation expands the complete resource list and checks every planned destination before writing:

- Existing files with identical bytes are preserved. Missing files and their parent directories are created.
- In default mode, any differing file aborts the entire preflight with the conflicting paths, before any installation writes. Existing directories where files are expected, or files where parent directories are needed, also cause failure.
- Symlinks in the target directory's ancestry, planned destination paths, or source resources are rejected. Unrelated destination paths are not scanned.
- `AGENTS.md` is protected and never copied. Review `AGENTS.template.md` and `AGENTS.integration.md`, then create or merge the target project's instructions yourself. In particular, `CLAUDE.md` imports that project-owned `AGENTS.md`.

By default, a differing file aborts the whole preflight. Review and back up the listed files, merge or move them, then retry. To update an existing Olympus installation from a newer Olympus checkout, add `--update`:

```sh
node ./bin/olympus.mjs install --target /path/to/project --update
```

Update replaces differing files from the package resource list, preserves byte-identical files and files outside that list, and still protects `AGENTS.md`. The installer cannot merge edits. Before updating, copy any customized managed files to a backup location outside the target's packaged resource paths. After updating, reapply or merge project-specific changes from that backup, especially for `CLAUDE.md`, `.codex/config.toml`, and `.claude/settings.json`.

Preflight is not a filesystem transaction. A later write, permission, disk-space, or concurrent filesystem failure can leave some files replaced and installation state incomplete; there is no rollback. Each resource is written through a temporary file and rename, and the lockfile is written last. Inspect the target after a failure. The CLI reports installed, updated, upgraded, overwritten and identical paths as applicable, exits with code 1 on operational failure, and uses code 2 for missing or invalid CLI arguments. `--json` provides structured output for both commands.

The package exposes the same installer as `olympus install --target /path/to/project`. **Only after npm publication under the current name and version**, the equivalent command will be:

```sh
npx --yes olympus-engineering-harness@1.3.0 install --target /path/to/project
```

Before publication, maintainers must confirm ownership/availability of the npm name and choose the license. The manifest's current identity does not establish registry availability or permission to publish.

This package installs Codex and Claude bindings and Pi agent definitions. A Pi manifest does not install or configure the Pi subagent harness itself.

## Update modes and installation state

A successful install records the package identity, version, scope and SHA-256 hashes of managed file contents in `.olympus/manifest.lock.json` under the selected root. A file is `identical` when it matches the current package, `outdated` when it differs from the package but still matches its recorded hash, and `modified` when it differs from both. Without a prior lockfile, every differing existing file is treated as modified.

Choose one mode; `--update`, `--upgrade` and `--force` are mutually exclusive:

| Mode | Differing managed files | Automatic backup |
|---|---|---|
| Default | Abort before writes if any are outdated or modified. | None |
| `--update` | Replace all, including local edits and installations without a prior lockfile. | None; back up customizations yourself. |
| `--upgrade` | Replace outdated files; any modified file aborts the entire preflight. | None |
| `--force` | Replace outdated and modified files. | Modified files get an adjacent `<filename>.olympus-bak`. |

Every mode creates missing files and preserves identical files. Force creates all required backups before replacing any managed resource, refuses to overwrite an existing backup, and rejects unsafe backup paths. Review or move old backups before another forced install. Modes do not merge edits, remove unmanaged files, or delete orphaned files previously recorded in the lockfile but no longer shipped. Orphans are reported; a successful install records only the current resource list.

Check the selected root without changing files:

```sh
node ./bin/olympus.mjs check --target /path/to/project --json
```

`check` reports missing, identical, outdated, modified and orphan paths. It creates no directories, backups or lockfile. Exit code 0 means all current managed resources match; code 3 means at least one is missing, outdated or modified. Orphans and a missing lockfile alone do not produce code 3. Malformed lockfiles or unsafe paths produce code 1. Install modes cannot be passed to `check`.

## Install for a user

```sh
node ./bin/olympus.mjs install --scope user
node ./bin/olympus.mjs check --scope user --json
```

User scope uses the operating system home directory. To select another existing root, add `--home /path/to/home`; `--home` is valid only with `--scope user`, and user scope cannot be combined with `--target`. The same conflict and update modes apply. Its lockfile lives at `<home>/.olympus/manifest.lock.json`.

This scope installs only `.agents/skills/`, `.agents/agents/`, `.codex/agents/`, `.claude/agents/` and `.claude/hooks/olympus_guard.py`. Codex and Claude agent skill references are rewritten to `~/.agents/skills/`; Claude agent hook commands reference `$HOME/.claude/hooks/olympus_guard.py`. Project configuration, settings, `CLAUDE.md`, instruction templates and tools are skipped. `--home` changes the installation root; it does not rewrite those references to an arbitrary absolute home path.

User installation does not configure the root session, project trust or runtime permissions. Neither installation scope copies the `olympus` CLI (`bin/`/`src/`) or creates global startup instructions. Claude's user-level `zeus` profile includes Hermes guidance, but applies only when explicitly selected with `claude --agent zeus`; Codex and Pi require the trusted project bootstrap and root setup described below. To use Olympus commands, run the CLI from an Olympus source checkout or unpacked package, or use a globally installed `olympus` CLI if available. `AGENTS.md` remains project-owned in both scopes; the installer never creates or overwrites global `AGENTS.md`/`CLAUDE.md` files.

## Hermes and Hades commands

From the target repository root, Hermes stores portable checkpoints and reconciles them against current repository evidence. Run the CLI from an Olympus source checkout or unpacked package (replace `/path/to/olympus` below), or use a globally installed `olympus` executable if available:

```sh
node /path/to/olympus/bin/olympus.mjs context save --input handoff.json
node /path/to/olympus/bin/olympus.mjs context discover
node /path/to/olympus/bin/olympus.mjs context load <checkpoint-id>
```

`discover` is read-only; always validate a selected head with `load`. Hermes never launches a runtime or restores historical permissions. See the [usage guide](docs/README.md) for checkpoint fields, retention, reconciliation and handoff limits.

Hades is a read-only investigator. Ask Zeus to investigate a suspected implementation; route any approved removal through the BURY workflow and normal Hephaestus/Argus gates. Historical inspection is available through `node /path/to/olympus/bin/olympus.mjs graveyard list --target /path/to/project` and the `search`, `inspect` and `exhume` subcommands (or `olympus graveyard ...` when a global CLI is available). EXHUME does not restore application files. See the [usage guide](docs/README.md#hades-investigate-before-removing) for evidence requirements and recovery limits.

## Setup launchers

The package includes optional launchers in `templates/`; project and user installation do not copy them to the target. Use them from the source checkout or unpacked package:

```sh
bash templates/setup-olympus.sh --skip-runtimes --project /path/to/project
bash templates/bootstrap-user.sh /path/to/olympus-checkout
```

On Windows, use `templates/setup-olympus.ps1 -SkipRuntimes -Project C:\path\to\project` or the adjacent `.cmd` wrapper with the same arguments. The CMD wrapper pauses unless `OLYMPUS_NO_PAUSE=1` is set and returns the PowerShell exit status.

The setup launchers check prerequisites and may install missing system tools through platform package managers. Without `--skip-runtimes` / `-SkipRuntimes`, they also attempt to install Claude Code and Codex CLI. Skipping runtimes still allows prerequisite installation. `--login` / `-Login` starts interactive sign-in afterward. These scripts can access the network and invoke elevated package managers; the direct Node CLI above only installs Olympus resources.

Setup installs user resources first, then project resources if requested, using `--upgrade` for both. Existing modified resources therefore stop the install rather than being overwritten. They discover the adjacent checkout by default, or accept `--source` / `-Source` or `OLYMPUS_SOURCE` for a local checkout path or npm package specification. `bootstrap-user.sh` only runs the user installation with `--upgrade` and requires its source argument or `OLYMPUS_SOURCE`; it does not install prerequisites or runtimes. Registry-based use requires that the selected package actually be published. Launcher execution on the target platforms remains unverified.

## Package maintenance

Two allowlists serve different purposes:

| File | Controls |
|---|---|
| `package.json` → `files` | Contents offered to npm's tarball packer, including the CLI, installer implementation, manifest, `README.md`, `docs/README.md`, `INSTALL.md`, runtime bindings, support files and the four `templates/` launchers. npm also applies its own packaging rules; inspect the resulting inventory. |
| `package-manifest.json` → `resources` | Files/directories expanded recursively and copied into the target project by the installer. |
| `package-manifest.json` → `protected` | Paths forbidden in the copy plan; currently `AGENTS.md`. |

The current installation resources are:

- `.agents/skills/`, `.agents/agents/`, `.codex/agents/`, `.codex/config.toml`.
- `.claude/agents/`, `.claude/hooks/olympus_guard.py`, `.claude/settings.json`.
- `AGENTS.template.md`, `AGENTS.integration.md`, `CLAUDE.md`, `ENGINEERING-PROTOCOL.md`, `MIGRATION.md`, `OLYMPUS.md`, `ZEUS-EVALUATION.md`, `ZEUS-START.md`.
- `tools/build_claude_agents.py`, `tools/migrate_legacy.py`, `tools/olympus_models.py`, `tools/validate_package.py`.

The npm tarball includes the installer, installation manual and four setup launchers. The target copy plan omits `bin/`, `src/`, `templates/`, both package manifests, `README.md`, and `INSTALL.md`. The installer creates its own `.olympus/manifest.lock.json` in addition to the copied resources. In particular, **the evaluation document and validator are copied into the target**. However, `tools/validate_package.py` requires `INSTALL.md`, so the installed resource set alone cannot satisfy that validator. Run it in the complete source checkout as described below. Update both allowlists deliberately when adding distributable resources.

**10 skill directories** (Zeus, Hermes, Hades and seven other specialist roles) are shared by every runtime, plus thin runtime bindings. Hermes is a continuity skill, not an agent; Hades is the eighth specialist role, with a read-only profile in each runtime:

- Codex: `.codex/config.toml` + 9 specialist TOMLs (two Atlas profiles). Zeus is the main Codex session.
- Claude Code: `CLAUDE.md` + `.claude/settings.json` + 10 agent files (`zeus` as main session, 9 specialist profiles) + the write-scope hook.
- Pi: 9 specialist profiles in `.agents/agents/`; the root model is selected in Pi.

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

- `CLAUDE.md` imports `AGENTS.md`, so Claude Code shares the project policy used by Codex and Pi.
- `claude --agent zeus` makes the main session take the `zeus` agent's prompt, tool allowlist and model (**claude-haiku-5-5 / medium**). `.claude/settings.json` also sets `"agent": "zeus"` as a fallback.
- Zeus's tools are `Agent(<9 specialist profiles>)`, `Read`, `Grep`, `Glob`, `Bash`. It cannot edit files and can dispatch **only** the nine named specialist profiles; Hades is read-only and no built-in agent can be substituted.
- Specialists have no Agent tool, so they cannot spawn each other; they return handoffs to Zeus, as in Codex.
- Read-only Git (`status`, `diff`, `log`, `show`, `rev-parse`, `ls-files`) is pre-allowed so Zeus and Argus can gather evidence; `git commit` and `git push` always ask; force-push and `git reset --hard` are denied.
- Add your project's test/build commands to `permissions.allow` (e.g. `"Bash(npm test:*)"`, in `.claude/settings.local.json` if personal). Otherwise each run asks, and in unattended/headless runs specialists will return `BLOCKED`, which is the correct behavior.
- Check with `/agents` (definitions loaded), `/model` (session model) and `/context` (CLAUDE.md + AGENTS.md loaded).
- To run Claude Code **without** Zeus for one session, start it with `claude --agent <other-agent>` (the CLI flag overrides the setting).

### Pi

The installer copies `.agents/agents/` and the shared skills. The specialist profiles reference the `@parke.dev/pi-subagent` integration, which must be installed and configured separately in your Pi environment. Copying the profiles does not install or configure that harness, select the root model, or establish a working delegation flow. Follow the profile requirements and verify routing in your own runtime before relying on it.

## Upgrade from earlier Olympus versions

The v1.3 release adds Hermes continuity, Hades archaeology and the Code Graveyard CLI. Use the v1.3.0 checkout and the `--update` command above to update a previous installation; review the project bootstrap merge because the installer preserves `AGENTS.md` and does not merge local edits.

For the runtime migration from v1.1, v1.2 adds Claude Code bindings and extends the skills' *execution profile* sections to list both runtimes. From a newer Olympus checkout, use the `--update` command above to copy those packaged resources into an existing project. The installer does not merge local edits.

1. `AGENTS.md` is protected and never overwritten. Back up customized `CLAUDE.md`, `.codex/config.toml` and `.claude/settings.json` outside the target's packaged resource paths.
2. Run `node ./bin/olympus.mjs install --target /path/to/project --update` to update differing packaged resources, including `.claude/agents/`, `.claude/hooks/`, the model tools and `.agents/skills/`, while preserving unrelated project files.
3. Reapply or merge project-specific changes from the backup using `AGENTS.integration.md`. If the project already has a `CLAUDE.md`, add the line `@AGENTS.md` at its top instead of replacing the updated file.

## Changing a model pin

In the complete source checkout, edit `tools/olympus_models.py`, run `python3 tools/build_claude_agents.py`, then update the matching `.codex/agents/*.toml` and `.agents/agents/*.md` by hand and run `python3 tools/validate_package.py`. The validator fails if Codex, Pi and Claude pins disagree with the shared table. The installed resource subset is insufficient for this source-level validation because it omits `INSTALL.md`.

## Validation and publication

An earlier packaging implementation received an independent Argus **PASS**, and an earlier `npm pack --dry-run --json` preview listed 57 files. That evidence predates the current installer modes and added launchers; it does not validate the current tarball inventory or behavior. The current integration has been documented from static source inspection. Installer, launcher and platform execution have not been verified as part of this integration.

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
| `Conflicting managed files found` | Review the paths. Use `--upgrade` for unchanged tracked resources, back up edits before `--update`, or review the automatic backup behavior before `--force`. No managed files are replaced when preflight detects conflicts. |
| `Backup already exists` | Review and move the existing `.olympus-bak` file before retrying force; the installer refuses to overwrite it. |
| Invalid lockfile or scope/package mismatch | Inspect `.olympus/manifest.lock.json` and confirm the selected root and scope. Update modes do not bypass lock validation. |
| A symlink/path error | Use a physical target directory and ordinary files/directories at the planned paths. Review the reported path before changing it. |
| A permission/copy failure | Inspect for a partial installation, correct the filesystem issue, then retry; already identical files are preserved. |
| `python3` unavailable in Claude hooks | Install/configure Python separately so `python3` is on the runtime's `PATH`. |
| Validator fails on missing `INSTALL.md` in a target project | Run the validator from the full Olympus source checkout. Its presence in the copied tools does not make the target subset a complete source package. |
| The future `npx` command cannot resolve the package/version | Use the local-checkout command until that exact npm package/version is published. |
| Pi definitions are present but delegation does not work | Configure the external Pi subagent integration and verify its routing separately. |

## Everyday usage (same prompts on Codex CLI, Claude Code and Pi)

- `Corrija este bug, siga Olympus, rode os testes e audite antes de concluir.`
- `Planeje esta mudança com Athena/Moirai conforme necessidade. Não implemente.`
- `Aegis: audite o fluxo de autenticação. Sem correções.`
- `Atlas em modo RELEASE: avalie a prontidão. Sem deploy.`

Codex: `/skills`, `/subagents`. Claude Code: `/agents`; an `@agent-<name>` mention forces a specific specialist. Loading a skill inline does **not** select the named model in either runtime.

## Operational caveats

- Codex and Claude Code project config applies only in **trusted** projects; CLI flags, local settings and managed (organization) settings can override it. Pi uses its independently configured root model and specialist harness. Confirm the actual selected model.
- `AGENTS.md`/`CLAUDE.md` are project guidance, not a security boundary. Privileges come from the runtime's sandbox, permission and approval settings. The Claude Code write-scope hook only covers file-editing tools; shell commands are still governed by permissions. Do not weaken sandboxing to make Olympus work.
- If the provider/account does not support a pinned model (or an effort level for that model), stop and report it rather than silently switching models.
- Frontmatter hooks (the write-scope guard) run **only after the folder is trusted**; in an untrusted folder Claude Code skips them silently in headless mode. Open the repo once interactively and accept the trust prompt.
- These files were structurally validated offline and smoke-tested live on Claude Code 2.1.302 (LOCAL route Zeus → Hephaestus → Argus with no commit; write-scope guard blocking Aegis outside `knowledge/security/`); Codex routing and the full scenario suite must still be verified with your runtime versions and credentials (see `ZEUS-EVALUATION.md`).
