# 01 — Installer integration

Status: PENDING. Prerequisite: Athena contract accepted by Zeus on 2026-10-20. Single task: [ST01-T01](tasks/ST01-T01.md), with no other task dependencies.

## Accepted contract

Integrate the installer core from `olympus-pipeline (Full Install).zip`: user scope, upgrade, force and check. Retain local `--update` semantics: replace all differing managed files without requiring a prior lock. Default install rejects conflicts; upgrade replaces only files matching hashes in the prior lock; force replaces edited files only after safe backup. Support `--scope user` and `--home`. Check performs no writes. Preserve protected `AGENTS.md` and unmanaged/orphan files.

Validate lock structure and hashes and preflight lock and backup auxiliary paths before writes. Prevent symlink traversal and backup overwrite. Adapt launchers and integrate docs/inventory. Do not adopt ZIP package identity, publishing pipeline or plugin wholesale. These decisions are the source contract relayed by Zeus, not a separate Athena artifact.

## Boundary and gates

Allowed: installer, CLI, adapted setup launchers, packaging/install inventory and documentation. Preserve existing edits in `INSTALL.md`, `bin/olympus.mjs`, `src/installer.mjs` and all untracked user files. No new production dependency, commit or push.

Exit requires task acceptance, baseline-preserving diff review, and Argus review of nontrivial behavior and failure paths. Orpheus updates docs from the integrated behavior before final audit. Runtime and platform checks remain explicitly unverified; do not run tests unless requested by the user.

Recovery: provide the focused integration diff and baseline evidence; do not reset, clean or overwrite the user's work. Refer unresolved scope/ownership/security contracts to Athena before implementing them.
