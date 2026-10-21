#!/usr/bin/env node
import { check, install } from "../src/installer.mjs";
import { discoverContexts, findProjectRoot, inspectContext, loadContext, parseAgeDays, pruneContexts, readContextInput, saveContext } from "../src/context.mjs";
import { exhumeGraveyard, inspectGraveyard, listGraveyard, validateGraveyard } from "../src/graveyard.mjs";

const USAGE = `Usage:
  olympus install --target <project-directory> [--update|--upgrade|--force] [--json]
  olympus install --scope user [--home <directory>] [--update|--upgrade|--force] [--json]
  olympus check   (--target <project-directory> | --scope user [--home <directory>]) [--json]
  olympus graveyard <validate|list|search|inspect|exhume> ...

Modes:
  install   Copy missing files, preserve identical files, and reject conflicts by default.
  --update  Replace every differing managed file, with or without a prior lockfile.
  --upgrade Replace only files matching hashes in .olympus/manifest.lock.json.
  --force   Replace locally modified files after creating non-overwriting .olympus-bak backups.
  check     Report drift without creating directories, backups, or a lockfile (exit 3 when drift exists).
  --scope user installs user-level agents, skills and hooks under the selected home directory.
  --home    Override the home directory for --scope user. Project scope always requires --target.`;

const CONTEXT_USAGE = `Usage:
olympus context save --input <project-relative-json|-> [--target <project>]
olympus context inspect <id> [--target <project>] [--json]
olympus context discover [--task <task-id>] [--target <project>] [--json]
olympus context load <id> [--target <project>] [--max-age-days <0..3650>] [--json]
olympus context prune --older-than-days <0..3650> [--target <project>] [--json]

Checkpoint JSON is immutable and limited to 64 KiB under .olympus/context/.
Discovery is read-only and selects at most one unfinished head; always load its ID
to revalidate. Load emits a fixed manual-handoff bootstrap; it never launches or
detects a runtime and never restores historical permissions. Default freshness is
seven days. Ignored files are outside the work fingerprint. Add a narrow,
user-managed .gitignore rule for transient checkpoints; Olympus does not edit it.`;

function usage(message) {
  if (message) console.error(message);
  console.error(USAGE);
  process.exit(2);
}

const args = process.argv.slice(2);
const command = args.shift();
if (command === "context") {
  const subcommand = args.shift();
  if (!subcommand || ["--help", "-h"].includes(subcommand)) { console.log(CONTEXT_USAGE); process.exit(0); }
  if (!["save", "inspect", "discover", "load", "prune"].includes(subcommand)) usage(`Unknown context command: ${subcommand}\n${CONTEXT_USAGE}`);
  const options = { json: false };
  const positionals = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (["--input", "--target", "--task", "--max-age-days", "--older-than-days"].includes(arg)) {
      const value = args[++index];
      if (!value || value.startsWith("--")) usage(`${arg} requires a value\n${CONTEXT_USAGE}`);
      options[arg.slice(2).replaceAll("-", "_")] = value;
    } else if (arg === "--json") options.json = true;
    else if (arg.startsWith("-")) usage(`Unknown option: ${arg}\n${CONTEXT_USAGE}`);
    else positionals.push(arg);
  }
  if (positionals.length !== (["inspect", "load"].includes(subcommand) ? 1 : 0)) usage(`Unexpected positional argument\n${CONTEXT_USAGE}`);
  if (subcommand === "save" && !options.input) usage(`save requires --input\n${CONTEXT_USAGE}`);
  if (subcommand === "prune" && !options.older_than_days) usage(`prune requires --older-than-days\n${CONTEXT_USAGE}`);
  if (subcommand !== "load" && options.max_age_days !== undefined) usage(`--max-age-days applies only to load\n${CONTEXT_USAGE}`);
  if (subcommand !== "prune" && options.older_than_days !== undefined) usage(`--older-than-days applies only to prune\n${CONTEXT_USAGE}`);
  if (subcommand !== "discover" && options.task !== undefined) usage(`--task applies only to discover\n${CONTEXT_USAGE}`);
  try {
    const root = await findProjectRoot(options.target ?? process.cwd());
    let result;
    if (subcommand === "save") {
      const input = await readContextInput(root, options.input);
      const saved = await saveContext(root, input);
      if (!saved.ignored) console.error("Warning: .olympus/context is not ignored by Git; use a narrow user-managed ignore rule to keep transient state out of status.");
      result = { id: saved.checkpoint.id, file: saved.relative, taskId: saved.checkpoint.taskId, taskStatus: saved.checkpoint.taskStatus, ignored: saved.ignored };
    } else if (subcommand === "inspect") result = await inspectContext(root, positionals[0]);
    else if (subcommand === "discover") result = await discoverContexts(root, options.task === undefined ? {} : { taskId: options.task });
    else if (subcommand === "load") result = await loadContext(root, positionals[0], { maxAgeDays: options.max_age_days === undefined ? undefined : parseAgeDays(options.max_age_days, "--max-age-days") });
    else result = await pruneContexts(root, parseAgeDays(options.older_than_days, "--older-than-days"));
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.status === "INVALID" ? 5 : ["RECONCILIATION_REQUIRED", "SELECTION_REQUIRED"].includes(result.status) ? 4 : 0);
  } catch (error) {
    const persisted = subcommand === "save"
      ? error.lastSuccessfulCheckpoint
        ? ` Last successfully persisted checkpoint ${error.lastSuccessfulCheckpoint} remains unchanged.`
        : " No new checkpoint was persisted; existing state was left unchanged."
      : "";
    console.error(`Olympus context ${error.message}.${persisted}`);
    process.exit(1);
  }
}
if (command === "graveyard") {
  const subcommand = args.shift();
  const GRAVEYARD_USAGE = `Usage:
olympus graveyard validate [<GRAVE-id>] [--target <project>] [--json]
olympus graveyard list [--target <project>] [--json]
olympus graveyard search <query> [--target <project>] [--json]
olympus graveyard inspect <GRAVE-id> [--target <project>] [--json]
olympus graveyard exhume <GRAVE-id> [--export] [--target <project>] [--json]
Records are bounded JSON in knowledge/graveyard. EXHUMED is local inspection only; it never means RESTORED.`;
  if (subcommand === "--help" || subcommand === "-h" || subcommand === undefined) {
    console.log(GRAVEYARD_USAGE);
    process.exit(subcommand ? 0 : 2);
  }
  const options = { json: false, exportFiles: false };
  const positionals = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--target") {
      options.target = args[++i];
      if (!options.target || options.target.startsWith("--")) usage(`--target requires a directory\n${GRAVEYARD_USAGE}`);
    } else if (arg === "--json") options.json = true;
    else if (arg === "--export") options.exportFiles = true;
    else if (arg === "--help" || arg === "-h") { console.log(GRAVEYARD_USAGE); process.exit(0); }
    else if (arg.startsWith("-")) usage(`Unknown option: ${arg}\n${GRAVEYARD_USAGE}`);
    else positionals.push(arg);
  }
  const expected = subcommand === "validate" ? [0, 1] : subcommand === "list" ? [0, 0] : [1, 1];
  if (!expected || positionals.length < expected[0] || positionals.length > expected[1]) usage(`Invalid arguments\n${GRAVEYARD_USAGE}`);
  if (options.exportFiles && subcommand !== "exhume") usage(`--export applies only to exhume\n${GRAVEYARD_USAGE}`);
  if (!["validate", "list", "search", "inspect", "exhume"].includes(subcommand)) usage(`Unknown graveyard command\n${GRAVEYARD_USAGE}`);
  try {
    const root = await findProjectRoot(options.target ?? process.cwd());
    let result;
    if (subcommand === "validate") result = await validateGraveyard(root, positionals[0]);
    else if (subcommand === "list") result = await listGraveyard(root);
    else if (subcommand === "search") result = await listGraveyard(root, positionals[0]);
    else if (subcommand === "inspect") result = await inspectGraveyard(root, positionals[0]);
    else result = await exhumeGraveyard(root, positionals[0], { exportFiles: options.exportFiles });
    const exitCode = result.status === "INVALID" ? 5 : ["TRACE_UNAVAILABLE", "PENDING"].includes(result.status) ? 4 : 0;
    await new Promise((resolve, reject) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`, (error) => error ? reject(error) : resolve()));
    process.exitCode = exitCode;
  } catch (error) {
    console.error(`Olympus ${error.message}`);
    process.exit(1);
  }
}

if (command !== "graveyard") {
if (command === "--help" || command === "-h") {
  console.log(USAGE);
console.log(`\n${CONTEXT_USAGE}`);
  process.exit(0);
}
if (!["install", "check", "graveyard"].includes(command)) usage(command ? `Unknown command: ${command}` : undefined);

const options = { scope: "project", update: false, upgrade: false, force: false, json: false };
for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  switch (arg) {
    case "--target":
    case "--home":
    case "--scope": {
      const value = args[++i];
      if (!value || value.startsWith("--")) usage(`${arg} requires a value.`);
      options[arg.slice(2)] = value;
      break;
    }
    case "--update": options.update = true; break;
    case "--upgrade": options.upgrade = true; break;
    case "--force": options.force = true; break;
    case "--json": options.json = true; break;
    case "--help": case "-h": console.log(USAGE); process.exit(0); break;
    default: usage(`Unknown argument: ${arg}`);
  }
}
if (!["project", "user"].includes(options.scope)) usage(`Unknown scope: ${options.scope}`);
if (options.scope === "project" && !options.target) usage("An explicit --target directory is required (or use --scope user).");
if (options.scope === "user" && options.target) usage("--target cannot be combined with --scope user.");
if (options.scope === "project" && options.home) usage("--home can only be used with --scope user.");
if ([options.update, options.upgrade, options.force].filter(Boolean).length > 1) usage("--update, --upgrade and --force are mutually exclusive.");
if (command === "check" && (options.update || options.upgrade || options.force)) usage("check is read-only; install modes do not apply.");

const print = (label, paths) => { for (const item of paths) console.log(`${label} ${item}`); };
try {
  if (command === "check") {
    const result = await check(options);
    if (options.json) console.log(JSON.stringify(result, null, 2));
    else {
      print("Missing", result.missing);
      print("Outdated", result.outdated);
      print("Modified", result.modified);
      print("Orphan (in lockfile, no longer shipped)", result.orphans);
      console.log(`${result.identical.length} identical, ${result.missing.length} missing, ${result.outdated.length} outdated, ${result.modified.length} modified`
        + (result.lockVersion ? ` (lockfile version ${result.lockVersion})` : " (no lockfile)"));
    }
    process.exit(result.ok ? 0 : 3);
  } else {
  const result = await install(options);
  if (options.json) {
    const { lock, ...details } = result;
    console.log(JSON.stringify({ ...details, version: lock.version }, null, 2));
  } else {
    print("Installed", result.installed);
    print("Updated", result.updated);
    print("Upgraded", result.upgraded);
    print("Overwritten (backup kept)", result.overwritten);
    print("Preserved identical", result.identical);
    print("Orphan (in lockfile, no longer shipped; remove manually)", result.orphans);
    if (result.scope === "user" && result.skipped.length) console.log(`Skipped ${result.skipped.length} project-level files in user scope.`);
    console.log(`Olympus ${result.lock.version} ${result.scope} install recorded in ${result.root}/.olympus/manifest.lock.json`);
  }
  }
} catch (error) {
  console.error(`Olympus ${command} failed: ${error.message}`);
  process.exit(1);
}
}
