#!/usr/bin/env node
import { check, install } from "../src/installer.mjs";

const USAGE = `Usage:
  olympus install --target <project-directory> [--update|--upgrade|--force] [--json]
  olympus install --scope user [--home <directory>] [--update|--upgrade|--force] [--json]
  olympus check   (--target <project-directory> | --scope user [--home <directory>]) [--json]

Modes:
  install   Copy missing files, preserve identical files, and reject conflicts by default.
  --update  Replace every differing managed file, with or without a prior lockfile.
  --upgrade Replace only files matching hashes in .olympus/manifest.lock.json.
  --force   Replace locally modified files after creating non-overwriting .olympus-bak backups.
  check     Report drift without creating directories, backups, or a lockfile (exit 3 when drift exists).
  --scope user installs user-level agents, skills and hooks under the selected home directory.
  --home    Override the home directory for --scope user. Project scope always requires --target.`;

function usage(message) {
  if (message) console.error(message);
  console.error(USAGE);
  process.exit(2);
}

const args = process.argv.slice(2);
const command = args.shift();
if (command === "--help" || command === "-h") {
  console.log(USAGE);
  process.exit(0);
}
if (!["install", "check"].includes(command)) usage(command ? `Unknown command: ${command}` : undefined);

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
  }
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
} catch (error) {
  console.error(`Olympus ${command} failed: ${error.message}`);
  process.exit(1);
}
