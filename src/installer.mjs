import { cp, lstat, mkdir, readFile, readdir, realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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

async function expandSource(relative) {
  const source = path.resolve(packageRoot, relative);
  if (!isWithin(packageRoot, source)) throw new Error(`Invalid manifest path: ${relative}`);
  const info = await lstat(source);
  if (info.isSymbolicLink()) throw new Error(`Manifest resource cannot be a symlink: ${relative}`);
  if (!info.isDirectory()) return [relative];
  const result = [];
  for (const entry of await readdir(source, { withFileTypes: true })) {
    const child = path.posix.join(relative, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Manifest resource cannot contain a symlink: ${child}`);
    result.push(...await expandSource(child));
  }
  return result;
}

async function preflightPath(root, relative) {
  const parts = relative.split("/");
  let current = root;
  const leaf = parts.pop();
  for (const part of parts) {
    current = path.join(current, part);
    const info = await statIfExists(current);
    if (!info) continue;
    if (info.isSymbolicLink()) throw new Error(`Destination path contains a symlink: ${path.relative(root, current)}`);
    if (!info.isDirectory()) throw new Error(`Destination parent is not a directory: ${path.relative(root, current)}`);
    const resolved = await realpath(current);
    if (!isWithin(root, resolved)) throw new Error(`Destination path escapes target: ${path.relative(root, current)}`);
  }
  const target = path.join(current, leaf);
  const info = await statIfExists(target);
  if (!info) return { target, exists: false };
  if (info.isSymbolicLink()) throw new Error(`Destination resource is a symlink: ${relative}`);
  if (info.isDirectory()) throw new Error(`Destination resource is a directory where a file is expected: ${relative}`);
  const [sourceContent, targetContent] = await Promise.all([
    readFile(path.resolve(packageRoot, relative)), readFile(target),
  ]);
  if (!sourceContent.equals(targetContent)) return { target, exists: true, conflict: relative };
  return { target, exists: true, identical: relative };
}

export async function install({ target }) {
  const destination = path.resolve(target);
  const absoluteParts = path.parse(destination).root;
  let current = absoluteParts;
  for (const part of destination.slice(absoluteParts.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    const info = await statIfExists(current);
    if (!info) throw new Error(`Target directory does not exist: ${destination}`);
    if (info.isSymbolicLink()) throw new Error(`Target path contains a symlink: ${current}`);
    if (!info.isDirectory()) throw new Error(`Target path is not a directory: ${current}`);
  }
  const targetRoot = await realpath(destination);
  const manifest = JSON.parse(await readFile(path.join(packageRoot, "package-manifest.json"), "utf8"));
  const planPaths = [];
  for (const resource of manifest.resources) planPaths.push(...await expandSource(resource));
  const plan = [];
  const conflicts = [];
  const identical = [];
  for (const relative of [...new Set(planPaths)].sort()) {
    if (manifest.protected.includes(relative)) throw new Error(`Manifest includes protected path: ${relative}`);
    const item = await preflightPath(targetRoot, relative);
    plan.push({ relative, ...item });
    if (item.conflict) conflicts.push(item.conflict);
    if (item.identical) identical.push(item.identical);
  }
  if (conflicts.length) {
    throw new Error(`Conflicting files found; no files were written. Remove or move these paths and retry: ${conflicts.join(", ")}`);
  }
  const installed = [];
  for (const item of plan) {
    if (item.identical) continue;
    await mkdir(path.dirname(item.target), { recursive: true });
    await cp(path.resolve(packageRoot, item.relative), item.target, { errorOnExist: true, force: false });
    installed.push(item.relative);
  }
  return { installed, identical };
}
