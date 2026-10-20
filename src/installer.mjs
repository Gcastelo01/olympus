import { createHash } from "node:crypto";
import { chmod, lstat, mkdir, readFile, readdir, realpath, rename, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const LOCK_RELATIVE = ".olympus/manifest.lock.json";
const LOCK_VERSION = 1;

const USER_SCOPE_MAP = [
  { prefix: ".agents/skills/", dest: ".agents/skills/" },
  { prefix: ".agents/agents/", dest: ".agents/agents/" },
  { prefix: ".claude/agents/", dest: ".claude/agents/", transform: userScopeClaudeAgent },
  { prefix: ".claude/hooks/olympus_guard.py", dest: ".claude/hooks/olympus_guard.py" },
  { prefix: ".codex/agents/", dest: ".codex/agents/", transform: userScopeCodexAgent },
];
const SKILL_PATH_RE = /(?<![\w/~.$])\.agents\/skills\//g;

function userScopeClaudeAgent(text) {
  return text
    .replaceAll('"${CLAUDE_PROJECT_DIR:-.}/.claude/hooks/olympus_guard.py"', '"$HOME/.claude/hooks/olympus_guard.py"')
    .replace(SKILL_PATH_RE, "~/.agents/skills/");
}

function userScopeCodexAgent(text) {
  return text.replace(SKILL_PATH_RE, "~/.agents/skills/");
}

async function statIfExists(file) {
  try {
    return await lstat(file);
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
}

function isWithin(root, candidate) {
  return candidate === root || candidate.startsWith(`${root}${path.sep}`);
}

function isSafeRelative(relative) {
  return typeof relative === "string" && relative.length > 0 && !relative.includes("\\")
    && !path.posix.isAbsolute(relative)
    && relative.split("/").every((part) => part && part !== "." && part !== "..");
}

function sha256(buffer) {
  return `sha256:${createHash("sha256").update(buffer).digest("hex")}`;
}

async function expandSource(relative) {
  if (!isSafeRelative(relative)) throw new Error(`Invalid manifest path: ${relative}`);
  const source = path.resolve(packageRoot, relative);
  if (!isWithin(packageRoot, source)) throw new Error(`Invalid manifest path: ${relative}`);
  let current = packageRoot;
  let info;
  for (const part of relative.split("/")) {
    current = path.join(current, part);
    info = await lstat(current);
    if (info.isSymbolicLink()) throw new Error(`Manifest resource cannot be a symlink: ${path.relative(packageRoot, current)}`);
  }
  if (!info.isDirectory()) {
    if (!info.isFile()) throw new Error(`Manifest resource must be a file or directory: ${relative}`);
    return [relative];
  }
  const result = [];
  for (const entry of await readdir(source, { withFileTypes: true })) {
    const child = path.posix.join(relative, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Manifest resource cannot contain a symlink: ${child}`);
    result.push(...await expandSource(child));
  }
  return result;
}

async function validateRoot(directory) {
  const destination = path.resolve(directory);
  const rootPart = path.parse(destination).root;
  let current = rootPart;
  for (const part of destination.slice(rootPart.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    const info = await statIfExists(current);
    if (!info) throw new Error(`Target directory does not exist: ${destination}`);
    if (info.isSymbolicLink()) throw new Error(`Target path contains a symlink: ${current}`);
    if (!info.isDirectory()) throw new Error(`Target path is not a directory: ${current}`);
  }
  return realpath(destination);
}

// Resolve every existing ancestor using lstat so a symlink cannot redirect writes.
async function resolveDestination(root, relative) {
  if (!isSafeRelative(relative)) throw new Error(`Invalid managed path: ${relative}`);
  const parts = relative.split("/");
  const leaf = parts.pop();
  let current = root;
  for (const part of parts) {
    current = path.join(current, part);
    const info = await statIfExists(current);
    if (!info) continue;
    if (info.isSymbolicLink()) throw new Error(`Managed path contains a symlink: ${path.relative(root, current)}`);
    if (!info.isDirectory()) throw new Error(`Managed parent is not a directory: ${path.relative(root, current)}`);
    if (!isWithin(root, await realpath(current))) throw new Error(`Managed path escapes target: ${path.relative(root, current)}`);
  }
  const target = path.join(current, leaf);
  const info = await statIfExists(target);
  if (!info) return { target, exists: false };
  if (info.isSymbolicLink()) throw new Error(`Managed file is a symlink: ${relative}`);
  if (!info.isFile()) throw new Error(`Managed path is not a regular file: ${relative}`);
  if (!isWithin(root, path.resolve(target))) throw new Error(`Managed path escapes target: ${relative}`);
  return { target, exists: true, mode: info.mode };
}

async function readLock(root) {
  const resolved = await resolveDestination(root, LOCK_RELATIVE);
  if (!resolved.exists) return undefined;
  let lock;
  try {
    lock = JSON.parse(await readFile(resolved.target, "utf8"));
  } catch (error) {
    throw new Error(`Invalid lockfile ${LOCK_RELATIVE}: ${error.message}`);
  }
  if (!lock || lock.lockVersion !== LOCK_VERSION || typeof lock.package !== "string" || !lock.package
    || typeof lock.version !== "string" || !lock.version || !["project", "user"].includes(lock.scope)
    || typeof lock.installedAt !== "string" || Number.isNaN(Date.parse(lock.installedAt))
    || !lock.files || typeof lock.files !== "object" || Array.isArray(lock.files)) {
    throw new Error(`Unsupported lockfile format in ${LOCK_RELATIVE}`);
  }
  for (const [relative, hash] of Object.entries(lock.files)) {
    if (!isSafeRelative(relative) || relative === LOCK_RELATIVE || relative === "AGENTS.md") {
      throw new Error(`Invalid lockfile path: ${relative}`);
    }
    if (typeof hash !== "string" || !/^sha256:[a-f0-9]{64}$/.test(hash)) {
      throw new Error(`Invalid lockfile hash for ${relative}`);
    }
  }
  return lock;
}

async function buildPlanEntries(scope) {
  let manifest;
  try {
    manifest = JSON.parse(await readFile(path.join(packageRoot, "package-manifest.json"), "utf8"));
  } catch (error) {
    throw new Error(`Invalid package manifest: ${error.message}`);
  }
  if (!manifest || manifest.version !== 1 || !Array.isArray(manifest.resources) || !Array.isArray(manifest.protected)) {
    throw new Error("Invalid package manifest schema");
  }
  if (!manifest.protected.includes("AGENTS.md") || manifest.protected.some((relative) => !isSafeRelative(relative))) {
    throw new Error("Package manifest must safely protect AGENTS.md");
  }
  const sourcePaths = [];
  for (const resource of manifest.resources) sourcePaths.push(...await expandSource(resource));
  const entries = [];
  const skipped = [];
  const destinations = new Set();
  for (const relative of [...new Set(sourcePaths)].sort()) {
    if (manifest.protected.includes(relative)) throw new Error(`Manifest includes protected path: ${relative}`);
    if (relative === LOCK_RELATIVE) throw new Error(`Manifest must not include the lockfile: ${relative}`);
    let dest = relative;
    let transform;
    if (scope === "user") {
      const rule = USER_SCOPE_MAP.find((candidate) => relative === candidate.prefix || relative.startsWith(candidate.prefix));
      if (!rule) {
        skipped.push(relative);
        continue;
      }
      dest = rule.dest + relative.slice(rule.prefix.length);
      transform = rule.transform;
    }
    if (manifest.protected.includes(dest)) throw new Error(`Manifest maps to protected path: ${dest}`);
    if (destinations.has(dest)) throw new Error(`Multiple manifest resources map to the same destination: ${dest}`);
    destinations.add(dest);
    const content = await readFile(path.resolve(packageRoot, relative));
    const installedContent = transform ? Buffer.from(transform(content.toString("utf8")), "utf8") : content;
    const mode = (await lstat(path.resolve(packageRoot, relative))).mode & 0o777;
    entries.push({ source: relative, relative: dest, content: installedContent, hash: sha256(installedContent), mode });
  }
  return { entries, skipped };
}

export async function plan({ target, scope = "project", home } = {}) {
  if (!["project", "user"].includes(scope)) throw new Error(`Unknown scope: ${scope}`);
  if (scope === "user" && target) throw new Error("--target cannot be combined with --scope user.");
  if (scope === "project" && home) throw new Error("--home can only be used with --scope user.");
  if (scope === "project" && !target) throw new Error("An explicit --target directory is required for project scope.");
  const root = await validateRoot(scope === "user" ? home || os.homedir() : target);
  const lock = await readLock(root);
  if (lock) {
    const pkg = JSON.parse(await readFile(path.join(packageRoot, "package.json"), "utf8"));
    if (lock.package !== pkg.name) throw new Error(`Lockfile belongs to a different package: ${lock.package}`);
    if (lock.scope !== scope) throw new Error(`Lockfile scope mismatch: expected ${scope}, found ${lock.scope}`);
  }
  const { entries, skipped } = await buildPlanEntries(scope);
  const items = [];
  for (const entry of entries) {
    const dest = await resolveDestination(root, entry.relative);
    let status = "missing";
    let currentHash;
    if (dest.exists) {
      currentHash = sha256(await readFile(dest.target));
      if (currentHash === entry.hash) status = "identical";
      else if (lock?.files[entry.relative] === currentHash) status = "outdated";
      else status = "modified";
    }
    items.push({ ...entry, target: dest.target, status, currentHash, currentMode: dest.mode });
  }
  const planned = new Set(items.map((item) => item.relative));
  const orphans = lock ? Object.keys(lock.files).filter((relative) => !planned.has(relative)) : [];
  return { root, scope, lock, items, skipped, orphans };
}

function summarize(items) {
  const result = { missing: [], identical: [], outdated: [], modified: [] };
  for (const item of items) result[item.status].push(item.relative);
  return result;
}

async function prepareAuxiliaryPaths(root, items, force) {
  const lockPath = await resolveDestination(root, LOCK_RELATIVE);
  const lockTemp = await resolveDestination(root, `${LOCK_RELATIVE}.olympus-tmp`);
  if (lockTemp.exists) throw new Error(`Temporary lock path already exists: ${LOCK_RELATIVE}.olympus-tmp`);
  for (const item of items) {
    const tempRelative = `${item.relative}.olympus-tmp`;
    if ((await resolveDestination(root, tempRelative)).exists) throw new Error(`Temporary managed path already exists: ${tempRelative}`);
  }
  const backups = [];
  if (force) {
    for (const item of items) {
      if (item.status !== "modified") continue;
      const backupRelative = `${item.relative}.olympus-bak`;
      const backup = await resolveDestination(root, backupRelative);
      if (backup.exists) throw new Error(`Backup already exists; refusing to overwrite: ${backupRelative}`);
      backups.push({ item, ...backup });
    }
  }
  return { lockPath, backups };
}

async function writeLock(root, scope, items, lockPath) {
  const pkg = JSON.parse(await readFile(path.join(packageRoot, "package.json"), "utf8"));
  const files = {};
  for (const item of [...items].sort((a, b) => a.relative.localeCompare(b.relative))) files[item.relative] = item.hash;
  const lock = { lockVersion: LOCK_VERSION, package: pkg.name, version: pkg.version, scope, installedAt: new Date().toISOString(), files };
  await mkdir(path.dirname(lockPath.target), { recursive: true });
  const temp = `${lockPath.target}.olympus-tmp`;
  await writeFile(temp, `${JSON.stringify(lock, null, 2)}\n`, { flag: "wx" });
  await rename(temp, lockPath.target);
  return lock;
}

async function replaceFile(item) {
  await mkdir(path.dirname(item.target), { recursive: true });
  const temp = `${item.target}.olympus-tmp`;
  await writeFile(temp, item.content, { flag: "wx" });
  try {
    await chmod(temp, item.mode);
    await rename(temp, item.target);
  } catch (error) {
    await unlink(temp).catch(() => {});
    throw error;
  }
}

export async function check(options) {
  const result = await plan(options);
  const summary = summarize(result.items);
  const ok = summary.missing.length === 0 && summary.outdated.length === 0 && summary.modified.length === 0;
  return { ok, root: result.root, scope: result.scope, lockVersion: result.lock?.lockVersion, orphans: result.orphans, skipped: result.skipped, ...summary };
}

export async function install({ update = false, upgrade = false, force = false, ...options } = {}) {
  if ([update, upgrade, force].filter(Boolean).length > 1) throw new Error("--update, --upgrade and --force are mutually exclusive.");
  const result = await plan(options);
  const summary = summarize(result.items);
  const conflicts = [];
  if (!update && !upgrade && !force) conflicts.push(...summary.outdated);
  if (!update && !force) conflicts.push(...summary.modified);
  if (conflicts.length) {
    const error = new Error(`Conflicting managed files found; no files were written: ${[...new Set(conflicts)].join(", ")}`);
    error.conflicts = [...new Set(conflicts)];
    throw error;
  }
  const auxiliary = await prepareAuxiliaryPaths(result.root, result.items, force);
  const installed = [];
  const updated = [];
  const upgraded = [];
  const overwritten = [];
  // Create every force backup before replacing any managed file. If a backup
  // cannot be created, the managed installation remains untouched.
  for (const backup of auxiliary.backups) {
    await mkdir(path.dirname(backup.target), { recursive: true });
    await writeFile(backup.target, await readFile(backup.item.target), { flag: "wx", mode: backup.item.currentMode });
  }
  for (const item of result.items) {
    if (item.status === "identical") continue;
    if (item.status === "modified" && force) {
      overwritten.push(item.relative);
    }
    if (item.status === "missing") installed.push(item.relative);
    else if (update) updated.push(item.relative);
    else if (item.status === "outdated") upgraded.push(item.relative);
    else if (item.status === "modified" && !force) updated.push(item.relative);
    await replaceFile(item);
  }
  const lock = await writeLock(result.root, result.scope, result.items, auxiliary.lockPath);
  return { root: result.root, scope: result.scope, installed, updated, upgraded, overwritten, identical: summary.identical, orphans: result.orphans, skipped: result.skipped, lock };
}
