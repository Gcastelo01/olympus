# Hermes, Hades and the Code Graveyard

STATUS: READY

Owner: Athena. Baseline: `d881797f16d3aec3465c0da7504dbd4963c7f7f4`.
Scope authorized by the user: implement, validate, commit on a feature branch,
push that branch and open a PR; no merge, production action or publication.
This contract guides Moirai decomposition. It is not evidence of implemented behavior.

## Goal and observed foundations

Provide verifiable continuation of a task in another session or harness, and
deterministic lookup and inspection of retired implementations from Git.
When the user starts another configured harness normally in the same project,
Zeus must invoke the shared Hermes methodology at the first actionable turn,
discover prior checkpoints and prepare validated context without requiring the
user to remember a checkpoint ID or manually paste its contents.

Observed in the checked-out repository:

- `bin/olympus.mjs` dispatches `install` and `check`; `src/installer.mjs`
  supplies a Node standard-library installer, explicit manifest, project/user
  mapping, conflict handling, hashes and symlink checks.
- `package.json` requires Node >=18. No new production dependency is needed.
- `tools/olympus_models.py` is the central pin table.
  `tools/build_claude_agents.py` generates Claude profiles. Codex and Pi
  profiles are maintained separately and checked by `tools/validate_package.py`.
- Claude Zeus has no editing tools. Existing Claude write-scope hooks constrain
  file editing tools, not arbitrary Bash. Existing specialist profiles are
  therefore not a complete sandbox precedent for Hades.
- Pi installation copies profiles but does not install/configure its external
  subagent harness or select the root model (`INSTALL.md`).
- `knowledge/` is the durable planning/evidence source; `ENGINEERING-PROTOCOL.md`
  makes Argus approval specific to the reviewed diff and bounds repair cycles.
- The live session exposes `headroom_memory`, but this is not evidence that an
  installed Olympus CLI has a memory client, credentials or an available server.
- Existing `AGENTS.template.md` directs the root session to read Zeus's skill;
  `CLAUDE.md` imports `@AGENTS.md`, while the generated Claude Zeus body has its
  own bootstrap. These are the instruction entry points to extend.

Official documentation consulted on 2026-10-20 confirms Codex project guidance
loading and Claude instruction-file/import loading; it does not establish that
a model will execute every requested tool call on startup. See
[Codex AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
and [Claude memory and imports](https://code.claude.com/docs/en/memory).
Current official Pi documentation establishes context-file discovery, with
`--no-context-files` disabling it, and trust requirements for project resources:
[CLI](https://pi.dev/docs/latest/cli) and
[configuration](https://pi.dev/docs/latest/configuration).
Its [extension API](https://pi.dev/docs/latest/extensions) also exposes
`session_start` and `before_agent_start`; extension code runs with the Pi
process's operating-system permissions. These are documented mechanisms,
not evidence of an installed version, external subagent integration or an
executed Hermes startup. Keep runtime observations separate from documentation.
Zeus additionally reported an actual installed-Pi help probe on 2026-10-20:
`env PI_CODING_AGENT_DIR=/tmp/olympus-pi-agent-verify pi --help` exited 0.
Its output documents default AGENTS/CLAUDE context discovery, the
`--no-context-files` opt-out, `PI_CODING_AGENT_DIR` and a read-only
`--tools read,grep,find,ls` example. This establishes the local CLI interface,
not authenticated model execution or enforcement by a named-agent profile.

No application-wide dead-code engine, index server, runtime conversation export,
automatic permission restoration or automatic reintegration is introduced.

## Chosen design and boundaries

Extend the CLI with small Node modules for context and graveyard operations,
using a shared bounded JSON/path/Git utility only where actually reused.
Do not redesign the installer or add a generic workflow framework.

Hermes is a canonical shared skill, not a new named agent. It explains how Zeus
assembles a compact handoff from durable artifacts, optional memory references
and current operational observations. CLI code validates and persists it.

Hades is a named read-only specialist and canonical shared skill. It returns a
structured report to Zeus. Hephaestus persists reports/records and performs
approved removals; Hades never edits its own findings into application files.
Athena handles consequential design questions; Moirai handles complex removals.
Argus independently reviews the actual removal and record.

Zeus's current authority remains sufficient: it may inspect/load/query state;
it delegates checkpoint creation and inspection exports to Hephaestus. The
human may invoke these CLI commands directly. Do not grant Zeus general file
writes or introduce an unrestricted Bash exception. `context load` emits its
validation report and bootstrap in memory/stdout. This preserves harness
authority while enabling portable context.

## Hermes schema and interfaces

Use strict JSON `schemaVersion: 1`, bounded to 64 KiB per checkpoint and bounded
arrays/strings. Unknown schema versions fail with an explicit unsupported-version
message; do not guess migrations. Reject unknown fields where they could hide
authority or uncontrolled payloads. Store new immutable checkpoint files at
`.olympus/context/<id>.json`; IDs use a conservative ASCII slug grammar.

The versioned schema contains:

- `id`, `taskId`, UTC creation time, source runtime and optional destination enum
  (`codex`, `claude`, `pi`, `unknown`).
- `taskStatus` (`active`, `paused`, `completed`) and optional `supersedes`
  containing the prior checkpoint ID and digest. Successors are immutable new
  checkpoints of the same project/task/branch. IDs and digests establish an
  explicit update chain; timestamps alone do not establish task precedence.
- `objective`, original `acceptance`, `constraints`, historical authorization
  notes, current `stage`, `openDecisions`, `blockers`, and a plain-text next step.
- Project identity, observed branch, full HEAD object ID and working-tree
  fingerprint. Git observations are populated by the tool, not accepted as
  authoritative caller assertions.
- Explicit relative artifact references and their content hashes. Each reference
  has a purpose; do not embed source files or whole knowledge documents.
- Test evidence: command as inert display text, execution time, observed outcome,
  relevant artifact references, HEAD and work fingerprint. Caller-supplied
  outcomes remain reported evidence; saving does not certify a test was run.
- Review evidence: role/verdict, report reference, base/head and exact work/diff
  fingerprint. A PASS never authorizes a commit by itself.
- Memory status (`unavailable`, `not-consulted`, `consulted`) and bounded
  nonsecret reference/summary if explicitly supplied; no automatic MCP/network
  access or environment discovery.

Use a project identity derived from a sanitized canonical remote identity when
available (host/repository, never credentials/query strings), plus repository
history anchors. A local-only repository uses a reachable root-history anchor;
identify this weaker provenance in output. Different remotes/anchors require
reconciliation. A copied checkout of the same project can load the checkpoint;
absolute local paths are not its portable identity.

The fingerprint must detect staged, unstaged and untracked changes, including a
second content edit that leaves `git status` unchanged. Hash status/path metadata
and current/index content digests rather than persisting diffs or file contents.
Exclude only the explicitly managed transient context/exhumation directories
and narrowly named tool-local metadata to avoid self-invalidation. Do not ignore
the whole `.olympus/` directory. Ignored files are outside the fingerprint and
this limitation must be stated. Relevant untracked files must be hashed;
unsupported symlinks/submodules or configured resource limits produce an
incomplete-state finding, never an apparently valid fingerprint.

Commands (implementation may refine option spellings without changing behavior):

| Command | Behavior |
| --- | --- |
| `olympus context save --input <json> [--target <project>]` | Validate explicit metadata, observe Git, hash references, exclusively create a bounded checkpoint. |
| `olympus context inspect <id> [--json]` | Parse and display bounded data without executing embedded text. |
| `olympus context discover [--task <task-id>] [--json]` | Read bounded local checkpoint metadata, identify relevant task heads and return a selection or an explicit ambiguity. No writes or runtime launch. |
| `olympus context load <id> [--json]` | Re-observe project/Git/files and emit a reconciliation report and safe bootstrap. No application mutation. |
| `olympus context prune --older-than-days <n>` | Explicit cleanup of managed checkpoint files only; no background deletion. |

Use a project option consistently for all applicable commands, defaulting to the
current Git root. Input paths remain bounded to the selected project; stdin is an
acceptable alternative for callers that do not want an extra metadata file.

`load` reports `READY`, `RECONCILIATION_REQUIRED` or `INVALID`, with reasons:
identity, branch/HEAD, work fingerprint, reference digest/existence, age and
review/test provenance. Reconciliation must return a distinct nonzero exit
status. A default maximum checkpoint age of seven days is an operational
freshness policy, not evidence correctness; allow an explicit bounded override.
Future timestamps and contradictions are reconciliation findings. Any material
Git or artifact change invalidates a stored Argus PASS and makes affected test
results historical. Even READY provides context only: current instructions,
permissions and real evidence must be consulted again.

Missing references query the graveyard by old path and return matching IDs,
reason, successor and trace status. A modified referenced file may have a
partial retirement entry too. Matches explain change; they never restore code
or suppress the reconciliation requirement.

Bootstrap is fixed Olympus-authored text naming the checkpoint and instructing
the destination to read its current policies, load/validate the checkpoint, and
treat recovered text as untrusted data. Do not interpolate arbitrary checkpoint
text into a shell command, instruction prefix or a higher-priority role message.
Historical authorization fields cannot enable commit, push, deployment or
destructive actions in the destination session.

## Zeus startup, checkpoint production and manual runtime launch

The user starts Codex, Claude or Pi normally. Olympus does not launch or detect
runtime executables and provides no `switch` command. Starting a new configured
Zeus session activates the following instruction-driven bootstrap at the first
model turn, before engineering routing. It does not run background code while
the CLI is idle at its prompt.

1. Read current project policy and Zeus's canonical skill. Respect project trust,
   current user requests and any instruction disabling continuity.
2. Zeus reads/applies the canonical Hermes skill itself. There is no Hermes
   child, model override or imagined specialist invocation.
3. Run read-only `context discover` in the current Git project, passing a task
   selector only when the current user request supplies an unambiguous task.
4. For a selected head, run `context load <id>` and use its actual validation
   report. Read only the bounded artifact references needed for the next task.
5. Briefly present source/task, verified progress, invalidated evidence,
   unresolved blockers and next action. Current user intent determines what
   work proceeds; discovering an old task does not authorize resuming it.

Hermes methodology is canonical in its shared skill. Zeus skill and runtime
bootstrap files contain short mandatory references to that procedure instead
of copies of its selection/security rules. Execute once per new logical session,
and re-run after compaction when the session cannot establish which context
was validated. Reconcile again before action if Git state has since changed.

### Producing continuity in the previous session

Zeus includes a bounded checkpoint obligation in Hephaestus's existing task
handoff. Save an initial checkpoint after accepting a task and before material
work when possible; save a successor after verified milestones, material changes
to next steps/blockers, and before a planned session handoff or turn-ending
summary. Include saves in an existing Hephaestus dispatch rather than creating
an agent round trip for every message. When no writer is active and a handoff
needs persistence, dispatch a narrowly scoped administrative Hephaestus task
whose only writes are the managed checkpoint files. User-selected completed
tasks receive a completed successor so they are not rediscovered as active.

Each save records current observations; it cannot renew a review or test verdict
merely by assigning a new fingerprint. Carry original evidence provenance
forward. Save failure must be surfaced with the last successfully recorded
checkpoint; never claim new progress is durable when persistence failed.
Do not overwrite the predecessor, move an active pointer or delete concurrent
session results. Conflicting successor chains remain visible for reconciliation.

This policy creates useful context before an ordinary change of CLI without
requiring a manual export request. It cannot capture unsaved conversational
progress after abrupt process termination, nor make a newly opened destination
observe a still-running source session's private state. The latest persisted,
validated checkpoint is the available boundary; two concurrent harnesses do not
gain authority to write the same task simultaneously.

### Deterministic discovery and selection

Discovery scans only regular managed JSON files immediately under
`.olympus/context/`, within explicit count/byte limits. No recursive repository,
home-directory, remote-memory or sibling-project search. Invalid filenames,
symlinks and incomplete/oversized JSON yield bounded diagnostics, not followed
paths. Output only ID, task ID/status, runtime, branch, timestamp, chain and
validation issues; do not emit objective/authorization/free-text payloads before
selection. Sanitize control characters in displayed metadata.

Project identity, optional requested task and current branch constrain relevance.
Validate `supersedes` links against predecessor digest, task/project/branch and
acyclic lineage. A linked predecessor missing because of explicit pruning marks
lineage incomplete and requires reconciliation; pruning must explain this
effect rather than silently guaranteeing future automatic selection.
Within a valid chain the leaf is its latest state. Completed leaves exclude
their predecessors from active selection. Paused tasks remain available.

Return a separate discovery result:

- `NONE`: absent directory, no checkpoints, or no relevant unfinished task;
  continue the user's normal request without creating state or an error.
- `SELECTED`: exactly one relevant unfinished task head, or an explicit
  user-selected ID. Selection is not evidence validity: always run `load`.
- `SELECTION_REQUIRED`: multiple task heads, conflicting branches of one chain,
  ambiguous project/branch, missing lineage, or invalid data that prevents
  establishing the relevant head. Present bounded IDs and reasons; ask for the
  intended task or reconciliation. Do not silently pick the largest timestamp,
  a matching objective string, or an older checkpoint that happens to pass.

An explicitly named invalid/missing checkpoint is an error, not `NONE`. A stale
or contradictory selected checkpoint goes through `load` and becomes
RECONCILIATION_REQUIRED/INVALID as applicable. The user may start a new task
without repairing unrelated old state; inherited actions stay paused.
Discovery limit errors must not return a selection from a partial scan.

### Runtime bindings and fallback

Codex uses the existing trusted project `AGENTS.md` bootstrap merged from
`AGENTS.template.md`, then the Zeus→Hermes skill chain. Update the integration
instructions because the installer protects existing `AGENTS.md`; installing
files alone cannot claim that an unmerged bootstrap is active. Project/root
model and specialist profiles remain configured as today.

Claude uses `CLAUDE.md` with its existing `@AGENTS.md` import plus the generated
Zeus main-session bootstrap in `tools/build_claude_agents.py`. Both reference
the same canonical Zeus→Hermes sequence. With existing `.claude/settings.json`
selecting Zeus, ordinary `claude` is the intended path; `claude --agent zeus`
remains the documented explicit selection when that setting is not active.
Preserve local settings and runtime permission prompts.

These bindings load instructions and ask the model to invoke Hermes and its
read-only CLI operations. They are not SessionStart hooks or a guarantee of
tool execution merely on process startup. Do not add a hook, launcher wrapper,
shell startup modification or hidden permission grant in this release.
Authenticated live Codex→Claude and Claude→Codex probes must verify actual
instruction loading, skill access, discovery and validation on the first turn.

Pi's selected integration is the same AGENTS→Zeus→Hermes instruction chain.
Official documentation and the installed CLI help support that mechanism;
Pi is not classified as manual-only. The session must load trusted guidance with
context-file discovery enabled, and the root session must be configured as Zeus.
Root-model selection remains explicit. The external subagent harness is needed
for Hephaestus checkpoint writes and other specialist work, but is not a
prerequisite for the root session merely reading Hermes and discovering/loading
an existing checkpoint. Copying specialist profiles alone establishes neither.

The options considered are:

| Pi binding | Decision and trade-off |
| --- | --- |
| Shared project `AGENTS.md` | Selected: reuses the existing bootstrap and canonical skill; no executable integration or new authority. Tool invocation remains instruction-driven and requires a live test. |
| `.pi/APPEND_SYSTEM.md` | Not added: another policy entry point would duplicate the existing bootstrap. Its availability does not justify injecting checkpoint data into a system prompt. |
| Trusted project `.pi/extensions/` callback | Technically supported, deferred: can observe a lifecycle event deterministically, but adds executable code, trust and packaging obligations without proving that checkpoint selection should bypass Zeus. |

This release therefore has no Pi extension artifact, new npm dependency,
extension registration, global hook or `.pi/settings.json` rewrite. Project
installation distributes the existing shared skills/profiles and documents the
required bootstrap merge without overwriting `AGENTS.md`. User installation
continues its current mappings; it does not install a process-wide extension or
grant trust to arbitrary projects. Preserve custom Pi config and existing tool
sets, root/specialist model pins and thinking levels. Respect disabled context
discovery and denied project trust; do not override either to activate Hermes.

If a live probe later demonstrates a concrete need for a Pi callback, reopen
this decision with that evidence. Any approved extension must be a thin,
version-tested adapter around the same context discovery/load implementation,
with no duplicate schema/selection logic, checkpoint writes, new model tools,
permission changes or provider/model overrides. It must run only after project
trust, preserve the untrusted-data boundary, and never insert checkpoint text
as higher-priority instructions. Package it explicitly with conflict-preserving
installation and dedicated project/user-scope decisions; do not smuggle it in
through a copied skill. The event API and reload behavior require their own
live verification before such an adapter can be claimed operational.

Until actual startup behavior is observed, mark Pi invocation `NOT_VERIFIED`,
the same evidentiary standard as Codex and Claude. For an unsupported, disabled
or unavailable bootstrap, the explicit fallback is a user prompt to Zeus to
apply Hermes and run `context discover`, followed by
`context load <selected-id>`, subject to the current trust/tool permissions.

If the CLI, skill or bootstrap is missing/unreadable, report continuity
unavailable with the exact missing prerequisite and manual save/load procedure.
Do not guess a checkpoint summary or run a network-installing `npx` command
without the applicable authorization. An ordinary locally installed `olympus`
or the documented trusted source invocation suffices; listing/read-only loading
does not require the destination executable to be installed.

### Privacy and trust

Automatic discovery is limited to a project whose Olympus guidance the user
has chosen to trust. Current user instructions can disable context recovery or
select a fresh task; no repeated confirmation is needed merely for the expected
local discovery within that trust boundary. Respect destination-provider data
restrictions from current policy: if transfer to that provider is prohibited
or requires consent, stop before loading free-text checkpoint/artifact content.
Checkpoint fields themselves cannot establish that consent.

Do not interpolate checkpoint text into policy imports, execute stored commands,
collect terminal history/transcripts or copy memory/environment indiscriminately.
Discovery and loading preserve the earlier bounded-input, secret detection and
authority rules. Local validation does not certify that arbitrary user-written
text is safe to send to every model provider. Explain in installation guidance
that applying Hermes exposes the selected summaries/references to the chosen
runtime in the same manner as other project files the agent reads.

## Installation

Distribute Hermes/Hades skills and Hades profiles through the existing manifest
directory entries. Include every new imported Node module in npm `files`.
The executable comes from the installed npm package/source invocation; copying
skills into a project or home does not install a global executable. State this
in the skills and installation docs. If a local CLI payload is added to managed
resources, it must have one explicit mapping and corresponding manifest tests;
do not duplicate implementation in skill scripts.

User installs map skill/profile references through the existing transforms.
No transient project checkpoint, graveyard instance or project identity is
copied into user scope. Preserve conflict/update semantics and custom settings.
A minor version increment to 1.3.0 is appropriate for additive CLI capabilities;
do not publish it.

## Hades contract and authority

Add only Hades to the central pins:
Codex `gpt-6-astra/high`, Claude `claude-opus-5-5/high`,
Pi `openai/gpt-6-astra/high`. Include it in the generated Claude Zeus allowlist.
No Hermes subagent and no spawnable Codex/Pi Zeus are added.

Hades output has report version, inspected revision/scope, method limitations
and candidates with ID, path/symbol, original function, suspicion, consumers,
dependencies, supporting and opposing evidence, confidence rationale, risk,
necessary tests, recommendation and unresolved questions.

Recommendations include `NEEDS_INVESTIGATION`, `KEEP`, and
`REMOVAL_CANDIDATE`; a candidate is never permission to delete. No known
reference by itself cannot yield a safe-removal recommendation.
Low risk requires a bounded internal component, positively identified replaced
or unreachable entry points, accounted consumers and meaningful regression
coverage. Moderate risk includes multi-module or framework interactions.
Public contracts, migrations, production-only paths, external consumers,
reflection and unbounded dynamic loading are high risk or UNKNOWN until
specific contrary evidence resolves them. Duplication alone does not prove
interchangeability.

Investigate progressively: existing evidence and targeted textual references,
entry points/configuration/manifests/history, then optional Serena/graph/LSP/
language tools when ambiguity justifies them. Every graph result carries
freshness and coverage limitations. No mandatory Graphify installation, full
repository indexing or code execution is necessary to use Hades.

Claude Hades must omit Bash, Write, Edit, MultiEdit, NotebookEdit and Agent:
Read/Grep/Glob suffice for baseline analysis. Runtime-sanctioned read-only
semantic tools may be available without mutating MCP tools. Codex must use a
supported read-only sandbox profile, not only prose. Pi must explicitly select
read-only tools using its verified profile interface; if enforcement cannot be
established, report that runtime limitation and require a read-only execution
environment. Do not invent unsupported config fields or claim prompts are
security boundaries. Execute tool-assisted history queries through a trusted
read-only path/coordinator when Hades itself lacks a safe command tool.

## Graveyard schema, tracing and lifecycle

Use strict bounded JSON at `knowledge/graveyard/<GRAVE-id>.json`; examples and
schema documentation belong to the package, real project records do not.
No copy of the retired source goes in an entry. Required data:

- schema version, stable ID, logical implementation name and original function;
- reason, Hades evidence, task and audit references, successor when applicable;
- affected paths/symbols, recovery risks and inert proposed restoration steps;
- retirement descriptors containing original path, Git blob ID before removal,
  resulting path and blob ID after change (or null for a deleted file);
- logical group/related-entry IDs when one retirement spans several commits.

Draft candidates live in the task/report until the approved removal is ready.
The first permanent entry is introduced in the SAME commit as its verified
retirement descriptors. This avoids an earlier CANDIDATE commit falsely
appearing to be the removal commit. No self-referential SHA is written.

Resolve the removal commit from reachable history of the stable entry path:
find its introduction, require an unambiguous commit with a usable parent, and
verify that parent and resulting tree match every descriptor. A root commit,
multiple ambiguous introductions, missing objects or a descriptor mismatch
cannot establish traceability. The containing parent revision supplies the
original blobs. Use full resolved object IDs and fixed Git argument vectors.
Git path arguments must use literal-path semantics, never user pathspec magic.
Partial-symbol retirements recover the old whole file for inspection and name
the relevant symbols; blob change proves a version transition, while the
independent review/evidence establishes the semantic removal. Do not pretend
this implements a universal AST verifier.

Renamed application files use explicit before/after paths. Keep record IDs and
paths stable. A logical removal over several commits uses related records,
each describing the event in its own introduction commit, rather than
inventing one atomic removal SHA. Merge/squash/rebase/cherry-pick traces resolve
against currently accessible history; they remain valid only when descriptors
still match the resulting parent/child trees. Otherwise return
`TRACE_UNAVAILABLE` with the reason and required history/reconciliation.
No automatic fetch or promise that old SHA objects still exist.

Lifecycle distinguishes permanent retirement from inspection:

- `CANDIDATE`: task/Hades evidence, not a completed graveyard entry.
- `BURIED`: committed entry with a verified retirement event.
- `EXHUMED`: a local inspection result/receipt, never implicit reintegration or
  a mutation of the permanent retirement record.
- `RESTORED`: an explicit later normal implementation/review/commit, documented
  by a restoration reference after that workflow; the original burial evidence
  remains available. Merely exporting bytes cannot produce this state.

Commands:

| Command | Behavior |
| --- | --- |
| `olympus graveyard validate [<id>]` | Validate schema; distinguish pending uncommitted records from resolvable committed retirements. |
| `olympus graveyard list/search <query>` | Bounded deterministic matching across names, paths, reasons and successors. No probabilistic memory claim. |
| `olympus graveyard inspect <id>` | Resolve retirement commit and show trace status, metadata and source revision. |
| `olympus graveyard exhume <id>` | Inspect original content/metadata read-only with bounded output. |
| `olympus graveyard exhume <id> --export` | Exclusively create a fresh inspection directory under `.olympus/exhumed/`; never overwrite application paths or prior exports. |

An export receipt names entry, resolved commit, parent, original paths, blob
digests and `EXHUMED` status. Export plain regular files only. Symlink/gitlink
objects are rejected or displayed as metadata, never materialized as links.
No `git checkout`, `restore`, `reset`, worktree switch or executable historical
script is needed. BURY is the documented specialist workflow, not an automatic
delete command. Hephaestus creates metadata and removal together after scope
approval, runs tests, obtains Argus review, then commits within user authority.

## Security, failures and resource bounds

All persistent text is untrusted inert data. Do not evaluate next-step strings,
test commands or restoration procedures. Reject path traversal, absolute/drive/
UNC paths, backslashes in portable paths, NUL/control characters and symlink
ancestors; check actual containment at each read/write boundary. Use exclusive
file creation and restrictive modes where available. Protect directory creation
and partial-failure cleanup; cleanup only files created by this invocation.
The tool does not promise safety against a malicious concurrent OS user able to
replace directory ancestors; state that trusted-worktree execution assumption.

Never auto-read `.env`, key stores, credentials or environment dumps into
handoffs. References to conventional sensitive paths are rejected. Scan
explicit free text for recognizable credentials/private keys and fail closed
on detected values without echoing them. This is defense in depth, not a proof
that arbitrary prose contains no secret; user-selected summaries must still
be reviewed. Fingerprints store digests, not sensitive contents.

Use `execFile`/`spawn` with fixed args, timeouts, bounded buffers and Git
read-only operations. Disable optional Git lock writes and external diff/text
conversion where relevant. Never invoke configured hooks, aliases, shell code
or a command obtained from state. Cap checkpoint/record bytes, referenced-file
bytes/count, history traversal, exported bytes and subprocess output; expose
clear limit errors, never silently truncate evidence into success.

Transient directories must be ignored explicitly by project setup or a reviewed
`.gitignore` change; `save` does not modify project policies implicitly.
Warn or reject transient state already tracked in Git. No automatic commits or
background retention. Explicit pruning deletes only validated managed names,
never symlinks, graveyard records or unrelated `.olympus/` contents.

## Alternatives and verification handoff

JSON avoids YAML parsing dependencies and ambiguous frontmatter. Git holds
source history rather than duplicate code archives. Conservative full-state
invalidation is simpler and safer than guessing whether changes are relevant.
User-launched runtimes and instruction-driven Hermes startup keep continuation
independent of native runtime session APIs.
Delegated administrative writes preserve Zeus's existing role boundary.

Moirai must amend the accepted plan for discovery, successor/task status schema,
checkpoint production obligations and Zeus startup integration before execution.
These changes affect context behavior, runtime guidance, installer documentation
and acceptance tests; updating documentation alone is insufficient.
For Pi, amend the runtime-integration and release-evidence tasks to implement
and verify the shared bootstrap as a documented candidate for automatic
invocation. Do not add an extension implementation task under this decision.
Installer acceptance must preserve project/user mappings and custom `.pi/`
settings, with no new executable extension payload. The context module/schema
contract does not change because of the newly confirmed Pi interfaces.
Sequence coherent milestones: state/Git utilities and Hermes;
graveyard trace/exhumation and cross-links; Hades/runtime/installer wiring;
documentation and final review. It owns atomic tasks and acceptance mapping.
Hephaestus owns implementation/tests; Orpheus documents verified behavior.
Aegis performs targeted assessment of untrusted state, processes, paths and
recovery before final Argus review. Follow existing bounded repair policy.

Tests must use temporary repositories and offline fixtures. Cover all specified
checkpoint identity/content/review/age/schema cases, secret/path/symlink cases,
read-only loading, unavailable memory and checkpoint handoff between all three
runtime labels. Context commands must work with no destination runtime installed.
Cover absent directories, multiple tasks, conflicting successor chains, completed
tasks, poisoned/future timestamps, invalid candidates, pruned/missing predecessors,
scan limits, changed Git state between discovery/load and failed saves without
overwriting a prior checkpoint. Verify discovery performs no writes, never
selects a partial scan and excludes unselected free-text content from output.
Include actual before/after blob tracing, rename, partial change, rewritten
history, shallow/missing objects, malicious records, export collisions and
unchanged application bytes. Hades fixture/oracle checks must cover dynamic
loading, conventions, unknown external consumers and duplication; structural
checks alone do not demonstrate a real model diagnosis.

Validate pins, generator output, Claude allowlist/tool restrictions, supported
Codex/Pi restrictions, npm package contents and project/user install/conflicts.
Record exact runtime versions and distinguish simulated handoff tests,
structural profile validation and real authenticated delegation. Linux results
cannot certify macOS/Windows; unperformed runtime/platform integration remains
`NOT_VERIFIED` with reproduction steps. No latency or capacity performance claim
is made without measurement.

For a real startup probe, create a benign checkpoint in a temporary trusted
project from Codex, start Claude normally with its existing Zeus configuration,
and submit a neutral continuation request without a checkpoint ID or pasted
bootstrap. Observe actual Zeus→Hermes skill access, discovery and load before
task routing. Repeat Claude→Codex, including stale/ambiguous checkpoint cases.
Verify prior-session Hephaestus saves and absence of restored permissions.
Static text assertions and mocked agent traces do not satisfy this live probe.
If authentication/model availability prevents it, report `NOT_VERIFIED` and
the precise reproduction steps; do not call automatic invocation proven.
Run the equivalent first-turn Pi probe with a checkpoint produced by Codex or
Claude: record installed Pi version, trusted-project context discovery, actual
Hermes access and discovery/load calls. Test the documented context-discovery
opt-out and denied-trust cases on versions that support them; Olympus must not
re-enable disabled resources. Verify that the unchanged root tool set and
model/thinking settings remain in effect. Record separately whether the
external harness can dispatch Hephaestus to produce the next checkpoint.
Missing credentials or installed Pi leave these checks `NOT_VERIFIED`, rather
than proving that Pi lacks an automatic startup mechanism.

Open evidence gaps: actual Pi tool restriction semantics; Codex profile
read-only sandbox support; instruction-driven Hermes invocation in actual
Codex/Claude/Pi sessions; authenticated three-runtime execution and cross-platform
tests. These do not block the
portable manual handoff or deterministic local functionality. They do block
claiming verified live handoff or enforced Hades isolation until the
specific boundary is verified.
