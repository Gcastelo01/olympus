# Codex Zeus bootstrap — issue #2

STATUS: READY

## Goal and scope

A fresh **project-scope** Olympus installation in a trusted repository must
provide Codex's root session with Zeus startup guidance when Codex loads its
project configuration. The first actionable turn follows the canonical
Zeus→Hermes procedure. Idle startup does not itself execute commands.

This is a bounded amendment to the Codex runtime binding in
`knowledge/architecture/hermes-hades.md`, which previously required a manual
project `AGENTS.md` merge. It preserves that contract's protected-file,
permission, global-installation and continuity boundaries. ST04-T01 records
historical implementation evidence and must not be rewritten to claim the new
behavior was previously verified.

User-scope installation, Pi/Claude startup, model selection, specialist routing
and the installer lifecycle are outside this change.

## Evidence

- `.codex/config.toml` currently sets the root model/effort and concurrency;
  it contains no instruction selecting Zeus's methodology.
- `AGENTS.template.md` and `AGENTS.integration.md` contain the missing bootstrap,
  but `src/installer.mjs` forbids copying `AGENTS.md`.
- `src/installer.mjs` already distributes project `.codex/config.toml` using
  ordinary conflict-preserving install/upgrade semantics. User mappings exclude
  this file. `test/st04-installation.test.mjs` covers project instruction
  preservation and absence of global startup instruction files.
- Official OpenAI documentation, consulted 2026-10-21, documents
  [`developer_instructions`](https://learn.chatgpt.com/docs/config-file/config-reference)
  as optional additional session instructions. The documented
  [project configuration layer](https://learn.chatgpt.com/docs/config-file/config-advanced)
  loads only for trusted projects. CLI overrides and more specific project
  layers can supersede a packaged setting.
- The locally installed CLI is located under Codex `0.163.0`. No authenticated
  model execution was performed for this architecture decision.
- Tokensave tools/database and an existing Graphify graph were unavailable;
  evidence above comes from focused source inspection.

## Decision and boundaries

Add a short, top-level `developer_instructions` string to the existing packaged
`.codex/config.toml`. It must direct the **main/root session only** to read and
apply the canonical `.agents/skills/zeus/SKILL.md` before routing engineering
work. Refer to the shared methodology rather than copying its full routing or
continuity logic into config.

The text must explicitly exclude sessions assigned a specialist/subagent role.
Inherited parent context must not convert Athena, Hephaestus, Argus or any
other assigned specialist into Zeus. Existing role instructions remain
authoritative for those sessions.

Because config guidance is delivered as developer instructions, explicitly
condition this bootstrap on the user's requested workflow and current project
policy. Honor explicit opt-outs and project restrictions; installing Olympus
must not create authority to disregard repository safety, approval or testing
instructions. The text grants no permissions and changes no sandbox/trust
settings.

The installer owns copying and conflict handling; Codex owns trusted config
loading; Zeus's canonical skill owns routing and Hermes invocation. No new
loader, hook, runtime wrapper, startup executable or dependency is needed.

## Invariants and failures

- Never create or modify protected project `AGENTS.md` or global instruction
  files. Preserve the existing user-scope mapping exactly.
- Keep root and specialist model/effort pins, concurrency, tool restrictions,
  approvals, sandbox and trust configuration unchanged.
- Keep existing install conflicts, upgrade hash checks and user-chosen update
  semantics. Do not silently merge or overwrite customized configs.
- A missing/unreadable Zeus skill produces an explicit prerequisite diagnostic;
  do not pretend startup succeeded or fetch/install it automatically.
- An untrusted project does not activate project config. Document the normal
  trust prerequisite; never grant trust automatically.
- Repeated/manual bootstrap paths converge on the canonical once-per-logical-
  session procedure. Do not duplicate discovery or restore checkpoint authority.
- Existing users merge the new top-level key into customized project configs,
  including any pre-existing `developer_instructions` value. A scalar config
  value does not automatically append across config layers.
- Rollback restores/removes this managed config guidance using normal reviewed
  update/merge procedures; no stored state schema or data migration is required.

## Alternatives

1. Automatically create/append project `AGENTS.md`: rejected because it changes
   ownership of a protected policy file and requires a new merge lifecycle.
2. Use a config fallback instruction filename: insufficient when `AGENTS.md`
   already exists; replacing base model instructions would be broader than the
   required additive bootstrap.
3. Use existing trusted project config: selected because the installer already
   distributes it and Codex documents an additive instruction setting.

## Implementation handoff and verification

This is one localized implementation task for Hephaestus, followed by independent
Argus review; no multi-stage Moirai decomposition is required.

1. Add the bounded bootstrap to project config and align current installation,
   integration and user documentation. Clearly distinguish automatic Codex
   project guidance from user-scope resources and other runtimes. Surface this
   amendment from the previous architecture contract without erasing history.
2. Add focused regression coverage proving a fresh project installation contains
   the parsed top-level instruction setting with canonical skill reference and
   specialist exclusion. Cover both absent and existing project `AGENTS.md`,
   preserving the latter byte-for-byte and leaving the former absent. Preserve
   custom-config conflict and user-scope absence checks. TOML placement must not
   accidentally put the setting inside `[agents]`.
3. Run relevant installation tests and existing package/config validators. An
   offline config-loading observation, if available, establishes loading only;
   parsing or regex checks alone do not establish model compliance.
4. Report authenticated first-actionable-turn Zeus/Hermes behavior as
   **NOT_VERIFIED** unless a real bounded probe records skill reading and routing.
   Include the root-versus-specialist distinction in review. Do not claim Windows,
   macOS or cross-harness behavior from Linux fixture tests.

## Remaining risk

Model compliance is instruction-driven. More specific config or explicit user
preferences can supersede the default. The source/template fix and structural
regression evidence are independently reviewable even when authenticated runtime
verification remains unavailable; report that gap precisely.
