# Installer update roadmap

| Stage | Outcome | Prerequisites | Status | Tasks |
| --- | --- | --- | --- | --- |
| [01-installer](stages/01-installer/README.md) | Safe installer modes and adapted launchers integrated | Accepted Athena handoff | PENDING | 1 |

Next unblocked task: [ST01-T01](stages/01-installer/tasks/ST01-T01.md). Dependency graph: accepted contract → ST01-T01 → independent Argus review. One bounded integration task; its ordered work passes keep security preflight ahead of writes and user entry points.

| Requirement / invariant | Task | Evidence |
| --- | --- | --- |
| Install conflict rejection; update preserves local semantics; upgrade/force ownership | ST01-T01 | Static branch and hash-policy review |
| User scope and read-only check | ST01-T01 | CLI-to-core mapping and side-effect review |
| Safe lock/backup paths, lock schema/hash validation | ST01-T01 | Preflight and rejection-path review |
| Protected AGENTS.md, orphans and dirty baseline preserved | ST01-T01 | Baseline comparison and diff review |
| Launcher adaptation, packaging inventory and documentation | ST01-T01 | Cross-file CLI/package/doc consistency review |

Risks: ZIP paths and auxiliary files are untrusted; user-scope writes reach outside projects; runtime and target-platform behavior remain unverified because this session forbids tests. No wholesale package identity, publishing pipeline or plugin import.
