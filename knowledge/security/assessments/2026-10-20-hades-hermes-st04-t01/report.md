# Aegis focused assessment — ST04-T01 profiles, bootstrap and installer

- Run: 2026-10-20-hades-hermes-st04-t01; date: 2026-10-20 UTC.
- Mode: FOCUSED; depth: STATIC_PLUS_AUTHORIZED_DYNAMIC for installer/local validation only.
- Baseline: HEAD `ec44ae815c0d869b111e463745cd1312df6cc1d0`, branch `feat/hermes-hades`, **dirty working-tree snapshot**.
- Scope: new Hermes/Hades skills; Zeus/Hephaestus continuity instructions; Hades Codex/Claude/Pi profiles; central pins, Claude generator and structural allowlist; package contents and installer project/fake-home boundaries.
- Exclusions: runtime authentication, live model/tool enforcement, full repository audit, production services and actual personal-home modification.
- Reporting: synthetic fixtures and redacted observations only; repository visibility was not established. No real credential, environment dump or executable attack bundle published.
- Aegis edited only assessment artifacts, with no commit.

## Decision

**No new actionable security finding established in this reviewed delta.** Zero findings across severity/evidence-status categories; no SEC ID allocated. Continue to Argus and final runtime evidence, with explicit partial/unverified capabilities below. This decision does not assert working authenticated integration or certify every runtime restriction.

Hades is structurally restricted: Codex requests read-only sandboxing; Claude exposes only Read/Grep/Glob and no Agent/Bash/write tools; Pi selects explore. Hermes remains a shared procedure, not a new child or executable hook. Current user intent and project/provider trust precede context discovery. The latest shared Hades skill explicitly excludes .env/credential/key/environment-dump inspection and separates record lookup from an export authorized and performed outside Hades.

## Snapshot SHA-256

- `.agents/skills/hermes/SKILL.md`: `907c3ccc031b6e628a46bc1daaa0712e8709bffd09a573ff188d051f03ed6ea7`
- `.agents/skills/hades/SKILL.md`: `421e05207f129d96930b1d5d705a337991b3a67f4cc8d58f5e4e73bd47e1daa1`
- `.agents/skills/zeus/SKILL.md`: `e7da88da8bc696c819e9964b6f32a508c826f80441be020550121a60ad67093a`
- `.agents/skills/hephaestus/SKILL.md`: `b1040b1009f311daedd160cc623ba3251371363afb8236b83af2527bc8b3bbf4`
- `.codex/agents/hades.toml`: `e51862f2665e3a44e9ac11d3bf16322ef049b908d475d889d9f9abb1edad9ef0`
- `.claude/agents/hades.md`: `767fb1e25dac4ae029373beed3f25b01c090b4a03eb4468b120c5180594da26a`
- `.claude/agents/zeus.md`: `d3e80a954fd161fde9a64aed15ab2a105cc5d1c200395b645bac1f0527b09639`
- `.agents/agents/hades.md`: `48fbdde0cdff5c1ea316c6288efe567b5b5a1af33ea6e0633952bc0cdcf0b330`
- `tools/olympus_models.py`: `62c1cb62d30d4f02e71bbc7bdafc44072e69b64d80ebbb2a1377ad0242e78788`
- `tools/build_claude_agents.py`: `a7300a530edcff8a239dcab24f7cf86c34b676c0629381ec7c35bb5ee7e7de62`
- `tools/validate_package.py`: `3b07b631795475d2c13cef9e2398749799733f47a8c8c2ebfae36737b118b3fe`
- `src/installer.mjs`: `6ea74b49f35d9a4be84147d4bc23c68e37ab036127fe0c04279f70b207a7ea1f`
- `package-manifest.json`: `f550521d210e7dc9c8af355ae6e323478d81e1917ed05ee1babd606455cdca8e`
- `package.json`: `c9f27a6d34f273e4ca1db1d3c9a7e6746fdd12a41b8195a9dcd07751344c6c5e`
- `AGENTS.template.md`: `bba46b30f0ac2c64b161671c773e76322ecf0677707e5ffa13a76fe7f6259861`
- `AGENTS.integration.md`: `423ae24c458388bb39d1f4707619ccf6685a2a8022bcddfddc58bc7f33619be2`
- `test/st04-installation.test.mjs`: `c94f56835125e1c3771900776633577196e48dd15ac72bd1e062bc37d15c0724`
- `test/hades-fixtures.test.mjs`: `a555211f64965c2ba36eaa46d4f4e506637ff2125634564be2fba7a7f8e0a6ed`
- `test/fixtures/hades-candidates.json`: `d88d34e4fe3f6e2990a118d3c376c175764b60109378d61aefb5d57e39a3c399`

## Trust/authority assessment

Assets are application files, private state, current permission boundaries, specialist model identity, and project/user-owned runtime configuration. Inputs include untrusted repository/history/checkpoint content and existing local runtime configuration. Profiles and skills form configuration/instruction boundaries; a running harness must actually enforce them.

Claude Zeus's Agent allowlist enumerates the nine central specialists, includes Hades and excludes Zeus/Hermes/general-purpose. The official [Claude subagent documentation](https://code.claude.com/docs/en/sub-agents) describes this allowlist for the main agent and tool allowlists for child agents. No authenticated attempt to spawn a prohibited type was made; negative tests below exercise Olympus validation, not Claude itself. Zeus still has Bash for observation, so its coordinator-only writing rule is policy, not a new OS sandbox. Existing Claude write-scope hooks explicitly do not constrain shell writes and were unchanged.

The published [Pi subagent package documentation](https://www.npmjs.com/package/%40parke.dev/pi-subagent) describes explore as a read-tool profile with safe extras. The actual installed extension version, selected child tools, model/fallback behavior and custom tool safety were not observed. Treat the profile's NOT_VERIFIED and stop-on-missing-enforcement instructions as an honest operational limit. A tool allowlist is not equivalent to Codex OS sandboxing.

Hermes treats checkpoint prose and Graveyard records as untrusted, disallows embedded-command execution and historical permission restoration, and requires current intent/trust. This is instruction-driven first-actionable-turn behavior. The delta adds no runtime startup hook, session launcher, credential persistence or automatic installation. CLI/state protections were assessed separately; they are not broadly recertified here.

## Actual local verification

- `node --test test/st04-installation.test.mjs test/hades-fixtures.test.mjs`: exit 0; two passing test files, zero failures/skips. Installation uses temporary project and fake-home targets. Hades tests validate labeled fixtures and contract text, not real model diagnoses.
- `env PYTHONDONTWRITEBYTECODE=1 python3 tools/validate_package.py`: exit 0; reports ten skills, nine specialist pins and valid root configuration.
- Imported Claude generator with output redirected to a temporary directory: ten generated files matched current profiles byte-for-byte. No project profiles regenerated by Aegis.
- Copied only the local npm pack file list to a temporary package: baseline validator passed. Replacing Hades with Zeus in the root Agent list caused failure; adding Bash to Hades tools caused failure. Both negative controls exited 1. These establish structural validation, not native runtime denial.
- `npm pack --dry-run --ignore-scripts --json --cache /tmp/aegis-npm-cache-st04`: exit 0; 69 files; new skills/profiles present; no .olympus, knowledge or .env paths. No publish/install performed.
- `node /tmp/aegis-st04-install.mjs`: exit 0; project and user-scope .agents symlinks rejected, external sentinel and file list unchanged; custom AGENTS.md and .pi/settings.json preserved in an otherwise clean project install.
- Existing focused fixtures also verified protected fake-home settings, project conflict atomicity, customized managed-profile upgrade rejection, and explicit update semantics. A default install/upgrade does not silently use update authority.
- `git diff --check`: exit 0. Installer implementation, package-manifest, Claude settings and guard hook have no delta.
- Official Claude documentation and published Pi package documentation consulted. Direct npm page fetch initially returned 403; indexed package documentation supplied the profile description. Installed package/source enforcement was not verified.

## Functional coverage limitation: user-scope bootstrap

The installer rewrites profile skill references for Codex/Claude but copies shared skill text unchanged. Zeus's shared skill still names `.agents/skills/hermes/SKILL.md` relative to the project. In a global-only installation, validate that the runtime/Zeus resolves the discovered global Hermes skill instead of relying solely on that literal project-relative path. Existing fallback instructions describe reporting unavailable continuity and offering manual CLI commands.

This is **functional coverage pending, not a confirmed security finding**. No live global-only session was executed, and no bypass or unauthorized data access was observed. The final validation must not treat copied files or regex checks as proof of automatic bootstrap.

## Focused coverage

| Focused control | Status | Evidence / boundary |
|---|---|---|
| Hades capability restriction | PARTIAL | Codex read-only sandbox, Claude exact Read/Grep/Glob, Pi explore profile inspected; no authenticated child-tool enforcement probe executed. |
| Pins, generation and Zeus routing allowlist | PASS | Central pins/validator pass; 10 generated Claude profiles byte-identical in temporary output; copied-package mutations reject Zeus as a spawned specialist and Bash in Hades. Structural result only. |
| Hermes trust, permissions and data handling | PARTIAL | Skills require policy/trust/current intent first, inert checkpoint/Graveyard data and no historic permission restoration; no new executable startup hook or launcher. Actual model compliance and provider transfer remain untested. |
| Installer conflicts/custom configuration | PASS | Project/user fake-home fixtures preserve protected AGENTS and user settings, reject conflicting project settings before partial install, reject customized profile on upgrade; explicit update follows existing documented managed-file replacement behavior. Independent Pi settings preservation probe passed. |
| Installer path containment | PASS | Independent project and fake-home .agents symlink probes rejected; external sentinel/entries unchanged. No concurrent ancestor-swap claim. |
| Package/state boundary | PASS | npm dry-run contains new skills/profiles; no .olympus, knowledge or .env paths; manifest and installer unchanged in delta; no production dependencies added. |
| Hades evidence/removal/secret rules | PARTIAL | Shared skill prohibits sensitive-file inspection, self-approval, application edits and export/restore; seven labeled fixtures cover uncertainty. Tests check fixture data and skill text, not a running Hades agent. |
| Live harness and global-only bootstrap | NOT_TESTED | No authenticated Codex/Claude/Pi invocation; Pi plugin version/enforcement and actual model selection unknown; global skill path resolution requires functional validation. |

Totals: **4 PASS / 0 FAIL / 3 PARTIAL / 1 NOT_TESTED / 0 NOT_APPLICABLE**.

## Handoff and limits

No new P0/P1 security correction is required by these observations. Preserve current model pins and the requirement to stop when Pi read-only enforcement is unavailable. Record live Codex/Claude/Pi startup, actual model/tool selection and global-only skill resolution separately as verified or NOT_VERIFIED. Also untested: Node 18, Windows/macOS filesystem behavior, malicious concurrent ancestor swaps, model prompt-injection resistance and arbitrary secret recognition. Existing prior findings and snapshots remain scoped and unchanged.

Argus should review the exact final diff. Further product documentation edits or implementation changes require their normal gates; this report is limited to its hashes.
