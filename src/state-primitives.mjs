import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { constants, lstat, open, readFile, realpath, rm } from "node:fs/promises";
import path from "node:path";

export const LIMITS = Object.freeze({ jsonBytes: 64 * 1024, referenceBytes: 256 * 1024, references: 32, gitOutputBytes: 2 * 1024 * 1024, gitTimeoutMs: 5_000, files: 4_000, totalBytes: 32 * 1024 * 1024 });
const SECRET_PATH = /(^|\/)(\.env(?:\.[^/]*)?|id_(?:rsa|dsa|ecdsa|ed25519)|[^/]*(?:credential|secret|token|private[-_]?key)[^/]*)(\/|$)/i;
const SECRET_VALUE = /(?:-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:api[_-]?key|access[_-]?token|client[_-]?secret|password)\s*[:=]\s*['"]?[^\s'";,]{8,}|\b(?:sk|xox[baprs])-[A-Za-z0-9_-]{16,}|\bgh[pousr][_-][A-Za-z0-9_-]{16,}\b|\bgithub_pat_[A-Za-z0-9_]{16,}\b|\bauthorization['"]?\s*:\s*['"]?\s*bearer\s+[A-Za-z0-9._~+/-]{8,}={0,})/i;
const TRANSIENT = [".olympus/context", ".olympus/exhumed"];

export function hash(value) { return `sha256:${createHash("sha256").update(value).digest("hex")}`; }

export function assertNoSensitiveContent(value) {
  const text = Buffer.isBuffer(value) ? value.toString("utf8") : String(value);
  if (SECRET_VALUE.test(text)) throw new Error("Content appears to contain sensitive material");
  const sensitiveJsonField = /"(?:password|api[_-]?key|access[_-]?token|client[_-]?secret|private[-_]?key)"\s*:\s*"((?:\\.|[^"\\])*)"/ig;
  if ([...text.matchAll(sensitiveJsonField)].some((match) => match[1].length > 0)) throw new Error("Content appears to contain sensitive material");

  // This heuristic rejects recognizable patterns; it cannot identify every secret format.
  let parsed;
  try { parsed = JSON.parse(text); } catch { return; }
  const bearerValue = /^\s*Bearer\s+[A-Za-z0-9._~+/-]{8,}={0,}/i;
  function visit(item) {
    if (typeof item === "string") {
      if (SECRET_VALUE.test(item)) throw new Error("Content appears to contain sensitive material");
      return;
    }
    if (!item || typeof item !== "object") return;
    if (Array.isArray(item)) {
      item.forEach(visit);
      return;
    }
    for (const [key, child] of Object.entries(item)) {
      if (/password|api[_-]?key|access[_-]?token|client[_-]?secret|private[-_]?key/i.test(key) && child !== null && child !== "") {
        throw new Error("Content appears to contain sensitive material");
      }
      if (/^authorization$/i.test(key) && typeof child === "string" && bearerValue.test(child)) {
        throw new Error("Content appears to contain sensitive material");
      }
      visit(child);
    }
  }
  visit(parsed);
}

export function validateId(value) {
  if (typeof value !== "string" || !/^[a-zA-Z0-9](?:[a-zA-Z0-9_-]{0,62}[a-zA-Z0-9])?$/.test(value)) throw new Error("Invalid identifier");
  return value;
}

export function validateRelativePath(value) {
  if (typeof value !== "string" || value.length > 1024 || !value || /[\\\0-\x1f\x7f]/.test(value) || value.startsWith("/") || /^[A-Za-z]:/.test(value) || value.startsWith("//")) throw new Error("Invalid portable relative path");
  const parts = value.split("/");
  if (parts.some((part) => !part || part === "." || part === "..")) throw new Error("Invalid portable relative path");
  if (SECRET_PATH.test(value)) throw new Error("Sensitive path is not allowed");
  return value;
}

export function parseBoundedJson(input, { maxBytes = LIMITS.jsonBytes, validate = () => {} } = {}) {
  const bytes = Buffer.isBuffer(input) ? input : Buffer.from(input);
  if (bytes.length > maxBytes) throw new Error("JSON exceeds size limit");
  assertNoSensitiveContent(bytes);
  let value;
  try { value = JSON.parse(bytes.toString("utf8")); } catch { throw new Error("Invalid JSON"); }
  validate(value);
  return value;
}

export async function resolveContained(root, relative, { allowMissing = false } = {}) {
  validateRelativePath(relative);
  const canonicalRoot = await realpath(root);
  const parts = relative.split("/");
  let cursor = canonicalRoot;
  for (let index = 0; index < parts.length; index += 1) {
    cursor = path.join(cursor, parts[index]);
    let info;
    try { info = await lstat(cursor); } catch (error) {
      if (error.code === "ENOENT" && allowMissing && index === parts.length - 1) return cursor;
      if (error.code === "ENOENT" && allowMissing) throw new Error("Missing parent directory for destination");
      throw new Error("Referenced path is unavailable");
    }
    if (info.isSymbolicLink()) throw new Error("Symbolic links are not supported");
    const resolved = path.resolve(cursor);
    if (resolved !== canonicalRoot && !resolved.startsWith(`${canonicalRoot}${path.sep}`)) throw new Error("Path escapes project root");
    if (index < parts.length - 1 && !info.isDirectory()) throw new Error("Path ancestor is not a directory");
  }
  return cursor;
}

export async function readSafeReference(root, relative) {
  const file = await resolveContained(root, relative);
  const info = await lstat(file);
  if (!info.isFile() || info.size > LIMITS.referenceBytes) throw new Error("Referenced file is not a bounded regular file");
  const data = await readFile(file);
  assertNoSensitiveContent(data);
  return { path: relative, digest: hash(data), bytes: data.length };
}

export async function readSafeReferences(root, paths) {
  if (!Array.isArray(paths) || paths.length > LIMITS.references) throw new Error("Reference count exceeds limit");
  const results = [];
  for (const relative of paths) results.push(await readSafeReference(root, relative));
  return results;
}

// Creates one new file only. On failure, cleanup is limited to the exclusive
// file descriptor/path this invocation created.
export async function writeExclusive(root, relative, data, { mode = 0o600, maxBytes = LIMITS.jsonBytes } = {}) {
  const bytes = Buffer.isBuffer(data) ? data : Buffer.from(data);
  if (bytes.length > maxBytes) throw new Error("Write exceeds size limit");
  const file = await resolveContained(root, relative, { allowMissing: true });
  let handle;
  try {
    handle = await open(file, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | (constants.O_NOFOLLOW || 0), mode);
    await handle.writeFile(bytes);
    await handle.close();
    return file;
  } catch (error) {
    await handle?.close().catch(() => {});
    if (handle) await rm(file, { force: true }).catch(() => {});
    if (error.code === "EEXIST") throw new Error("Refusing to overwrite existing file");
    throw new Error("Exclusive write failed");
  }
}

function git(root, args, { maxBuffer = LIMITS.gitOutputBytes, timeout = LIMITS.gitTimeoutMs, allowExitOne = false } = {}) {
  try {
    const env = { GIT_OPTIONAL_LOCKS: "0", GIT_TERMINAL_PROMPT: "0", GIT_NO_REPLACE_OBJECTS: "1", GIT_NO_LAZY_FETCH: "1", GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: process.platform === "win32" ? "NUL" : "/dev/null" };
    for (const key of ["PATH", "SYSTEMROOT", "WINDIR", "PATHEXT"]) if (process.env[key]) env[key] = process.env[key];
    return execFileSync("git", ["-C", root, "--no-pager", "--no-lazy-fetch", "-c", "core.fsmonitor=false", "-c", "core.untrackedCache=false", ...args], { encoding: "buffer", stdio: ["ignore", "pipe", "pipe"], timeout, maxBuffer, windowsHide: true, env });
  } catch (error) {
    if (allowExitOne && error.status === 1) return Buffer.alloc(0);
    if (error.code === "ENOBUFS" || error.errno === "ENOBUFS") throw new Error("Git output exceeds size limit");
    if (error.killed || error.code === "ETIMEDOUT" || error.errno === "ETIMEDOUT") throw new Error("Git observation timed out");
    throw new Error("Git observation failed");
  }
}

export function sanitizeProjectIdentity(remote) {
  if (typeof remote !== "string") return undefined;
  const input = remote.trim();
  if (!input || input.length > 512 || SECRET_VALUE.test(input)) return undefined;
  if (/^(?:https?|ssh|git):\/\//i.test(input)) {
    try {
      const url = new URL(input);
      if (!url.hostname || !["http:", "https:", "ssh:", "git:"].includes(url.protocol)) return undefined;
      url.username = "";
      url.password = "";
      url.search = "";
      url.hash = "";
      url.pathname = url.pathname.replace(/\/+$/, "");
      const cleaned = `${url.protocol}//${url.host}${url.pathname}`;
      return cleaned.length <= 512 ? cleaned : undefined;
    } catch { return undefined; }
  }
  // Accept only the conventional git@host:path form. Other scp-like user
  // fields are ambiguous and could carry credential material.
  const scp = /^(git@)?([A-Za-z0-9.-]+):([A-Za-z0-9._/-]+)$/i.exec(input);
  if (!scp || scp[1] && !input.toLowerCase().startsWith("git@")) return undefined;
  const host = scp[2].toLowerCase();
  const repoPath = scp[3].replace(/^\/+/, "").replace(/\/+$/, "");
  if (!host.includes(".") || !repoPath || repoPath.split("/").some((part) => !part || part === "." || part === "..")) return undefined;
  return `ssh://${host}/${repoPath}`;
}

// Lightweight identity observation for deterministic checkpoint discovery. It
// deliberately avoids status/index and source-tree fingerprint scans; load
// performs the full observeGit reconciliation before recovered work is used.
export async function observeGitIdentity(projectRoot) {
  const root = await realpath(projectRoot);
  const top = git(root, ["rev-parse", "--show-toplevel"]).toString("utf8").trim();
  if (await realpath(top) !== root) throw new Error("Project root must be the Git worktree root");
  const head = git(root, ["rev-parse", "--verify", "HEAD^{commit}"]).toString("utf8").trim();
  const branch = git(root, ["symbolic-ref", "--quiet", "--short", "HEAD"], { allowExitOne: true }).toString("utf8").trim() || "DETACHED";
  const remote = git(root, ["config", "--get", "remote.origin.url"], { maxBuffer: 4096, allowExitOne: true }).toString("utf8").trim() || undefined;
  const roots = git(root, ["rev-list", "--max-parents=0", "HEAD"], { maxBuffer: 16 * 1024 }).toString("utf8").trim().split(/\s+/).filter(Boolean).sort();
  if (!roots.length) throw new Error("Git history anchor is unavailable");
  const historyAnchor = roots.join(",");
  const sanitizedRemote = sanitizeProjectIdentity(remote);
  const identityBasis = sanitizedRemote ? `${sanitizedRemote}\n${historyAnchor}` : `local-history\n${historyAnchor}`;
  return {
    root,
    projectId: hash(identityBasis),
    identityProvenance: sanitizedRemote ? "remote-and-history" : "local-history-weaker",
    historyAnchor,
    branch,
    head,
  };
}

export async function observeGit(projectRoot) {
  const root = await realpath(projectRoot);
  const top = git(root, ["rev-parse", "--show-toplevel"]).toString("utf8").trim();
  if (await realpath(top) !== root) throw new Error("Project root must be the Git worktree root");
  const head = git(root, ["rev-parse", "--verify", "HEAD^{commit}"]).toString("utf8").trim();
  const branch = git(root, ["symbolic-ref", "--quiet", "--short", "HEAD"], { allowExitOne: true }).toString("utf8").trim() || "DETACHED";
  const status = git(root, ["--literal-pathspecs", "status", "--porcelain=v1", "-z", "--untracked-files=all", "--ignore-submodules=none"]);
  const statusParts = status.toString("utf8").split("\0").filter(Boolean);
  const statusEntries = [];
  for (let index = 0; index < statusParts.length; index += 1) {
    const entry = statusParts[index];
    statusEntries.push({ code: entry.slice(0, 2), name: entry.slice(3) });
    if (/[RC]/.test(entry.slice(0, 2))) index += 1; // -z emits the source path as a second field.
  }
  const names = statusEntries.map(({ name }) => name);
  const untracked = statusEntries.filter(({ code }) => code === "??").map(({ name }) => name);
  const included = names.filter((name) => !TRANSIENT.some((dir) => name === dir || name.startsWith(`${dir}/`)));
  const tracked = git(root, ["ls-files", "--stage", "-z", "--full-name"]);
  const entries = tracked.toString("utf8").split("\0").filter(Boolean);
  const digestItems = [];
  let total = 0;
  for (const record of entries) {
    const tab = record.indexOf("\t");
    const meta = record.slice(0, tab).split(" ");
    const name = record.slice(tab + 1);
    if (TRANSIENT.some((dir) => name === dir || name.startsWith(`${dir}/`))) throw new Error("Managed transient paths must not be tracked");
    if (meta[0] === "160000") throw new Error("Git submodules are not supported in work fingerprints");
    if (TRANSIENT.some((dir) => name === dir || name.startsWith(`${dir}/`))) continue;
    let file;
    try { file = await resolveContained(root, name); } catch (error) {
      const state = statusEntries.find((entry) => entry.name === name);
      if (state && /D/.test(state.code)) {
        digestItems.push(`${name}\0${meta[0]}\0${meta[1]}\0deleted`);
        continue;
      }
      throw error;
    }
    const info = await lstat(file);
    if (!info.isFile()) throw new Error("Non-regular tracked paths are not supported");
    total += info.size;
    if (digestItems.length >= LIMITS.files || total > LIMITS.totalBytes) throw new Error("Work fingerprint resource limit exceeded");
    digestItems.push(`${name}\0${meta[0]}\0${meta[1]}\0${meta[2]}\0${hash(await readFile(file))}`);
  }
  const trackedNames = new Set(entries.map((record) => record.slice(record.indexOf("\t") + 1)));
  for (const name of untracked.filter((candidate) => !trackedNames.has(candidate) && included.includes(candidate))) {
    const file = await resolveContained(root, name);
    const info = await lstat(file);
    if (info.isSymbolicLink()) throw new Error("Symbolic links are not supported in work fingerprints");
    if (!info.isFile()) throw new Error("Non-regular untracked paths are not supported");
    total += info.size;
    if (digestItems.length >= LIMITS.files || total > LIMITS.totalBytes) throw new Error("Work fingerprint resource limit exceeded");
    digestItems.push(`${name}\0untracked\0${hash(await readFile(file))}`);
  }
  const indexFile = path.join(root, ".git", "index");
  const indexDigest = await readFile(indexFile).then(hash).catch(() => "unavailable");
  const normalizedStatus = statusEntries
    .filter(({ name }) => !TRANSIENT.some((dir) => name === dir || name.startsWith(`${dir}/`)))
    .map(({ code, name }) => `${code} ${name}`).sort().join("\n");
  const fingerprint = hash([normalizedStatus, indexDigest, ...digestItems.sort()].join("\n"));
  let remote;
  remote = git(root, ["config", "--get", "remote.origin.url"], { maxBuffer: 4096, allowExitOne: true }).toString("utf8").trim() || undefined;
  const roots = git(root, ["rev-list", "--max-parents=0", "HEAD"], { maxBuffer: 16 * 1024 }).toString("utf8").trim().split(/\s+/).filter(Boolean).sort();
  if (!roots.length) throw new Error("Git history anchor is unavailable");
  const anchor = roots.join(",");
  const sanitizedRemote = sanitizeProjectIdentity(remote);
  const identityBasis = sanitizedRemote ? `${sanitizedRemote}\n${anchor}` : `local-history\n${anchor}`;
  let shallow = false;
  try { shallow = git(root, ["rev-parse", "--is-shallow-repository"], { maxBuffer: 1024 }).toString("utf8").trim() === "true"; } catch { /* older Git: provenance remains conservative */ }
  return { root, projectId: hash(identityBasis), identityProvenance: sanitizedRemote ? "remote-and-history" : "local-history-weaker", historyAnchor: anchor, shallowHistory: shallow, branch, head, workFingerprint: fingerprint, ignoredFilesExcluded: true, ignoredFilesNote: "Ignored files are not included unless tracked or otherwise reported by Git." };
}

