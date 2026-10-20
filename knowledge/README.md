# Installer integration map

Agent-facing plan for incorporating the colleague's installer update. Source: Athena's accepted contract relayed by Zeus on 2026-10-20, recorded in the [stage](stages/01-installer/README.md). Baseline: `74cb1a225825f1df035e5a686c72c60a41564088` plus existing local edits.

Start with the [roadmap](roadmap.md). Execute one task at a time; Hephaestus records evidence, Argus reviews, and Orpheus handles human-facing documentation. Tests are prohibited by the current session instruction unless the user requests them. Do not infer runtime verification from static review.

States: PENDING → IN_PROGRESS → READY_FOR_AUDIT → APPROVED → DONE; BLOCKED requires an explicit blocker and next action. DONE requires acceptance evidence and applicable Argus approval, with runtime checks explicitly deferred when forbidden. No commit or push is authorized.
