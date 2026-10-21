# Installer integration map

Agent-facing plan for incorporating the colleague's installer update. Source: Athena's accepted contract relayed by Zeus on 2026-10-20, recorded in the [stage](stages/01-installer/README.md). Baseline: `74cb1a225825f1df035e5a686c72c60a41564088` plus existing local edits.

Start with the [roadmap](roadmap.md). Execute one task at a time; Hephaestus records evidence, Argus reviews, and Orpheus handles human-facing documentation. Tests are prohibited by the current session instruction unless the user requests them. Do not infer runtime verification from static review.

States: PENDING → IN_PROGRESS → READY_FOR_AUDIT → APPROVED → DONE; BLOCKED requires an explicit blocker and next action. DONE requires acceptance evidence and applicable Argus approval, with runtime checks explicitly deferred when forbidden. No commit or push is authorized.


## Current work: Hermes and Hades

The [current roadmap](roadmap.md#hermes-hades-v13) follows Athena's [accepted contract](architecture/hermes-hades.md), baseline `d881797f16d3aec3465c0da7504dbd4963c7f7f4`, branch `feat/hermes-hades`. Only the architecture artifact was untracked when planning began; no implementation or tests have been performed by Moirai. The earlier installer plan above is historical and retains its recorded status; do not resume it as a prerequisite.

The current user explicitly authorizes local tests, scoped commits after Olympus gates, feature-branch push and a PR to main. These permissions supersede the older session-specific test/commit prohibition for this work only. No direct main changes, merge, publish, deploy or destructive Git operations. The user launches runtimes manually; Zeus invokes shared Hermes on the first actionable turn via trusted project guidance, then discovers and loads safely. No CLI switch, launch orchestration or runtime hook. Initial/milestone/handoff checkpoints are delegated to Hephaestus within existing task work.

Execute one task at a time. Hephaestus owns implementation and evidence-based ledger progress; Orpheus owns product documentation, Aegis owns security findings/reassessment, and Argus owns independent review. READY_FOR_AUDIT and DONE require actual evidence; every material post-review edit invalidates approval. Record missing runtime/platform evidence as NOT_VERIFIED with reproduction steps. Follow the existing two-unproductive-repair stop; the user explicitly authorized additional independent reviews for this implementation. Planning does not certify implemented behavior.

Startup amendment: use Athena's current contract. Stage 02 and Stage 03 are committed through `ec44ae8`; Stage 04 and Stage 05 now await current-diff final Argus and authorized delivery gates. All three runtimes use instruction-driven Zeus→Hermes startup; authenticated execution is NOT_VERIFIED until observed. Pi uses shared AGENTS guidance with no extension, respects trust/context opt-out and retains prompt fallback when unavailable.
