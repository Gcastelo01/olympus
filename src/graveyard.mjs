import { execFileSync } from "node:child_process";
import { constants } from "node:fs";
import { mkdir, lstat, open, opendir, realpath, rm } from "node:fs/promises";
import path from "node:path";
import { assertNoSensitiveContent, LIMITS, parseBoundedJson, resolveContained, validateRelativePath } from "./state-primitives.mjs";

const ID = /^GRAVE-[0-9]{3,6}$/;
const OID = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;
const MAX_RECORDS = 500;
const MAX_HISTORY = 20_000;
const MAX_FILES = 32;
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_EXPORT_BYTES = 8 * 1024 * 1024;
const MAX_EXHUME_OUTPUT_BYTES = 8 * 1024 * 1024;
const RECORD_BYTES = 64 * 1024;
const GRAVE_DIR = "knowledge/graveyard";
const EXHUME_DIR = ".olympus/exhumed";

function invalid(message = "Invalid graveyard record") { throw new Error(message); }
function text(value, label, max = 2000) {
  if (typeof value !== "string" || !value.trim() || value.length > max || /[\0-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value)) invalid(`Invalid ${label}`);
  return value;
}
function ref(value, label) {
  text(value, label, 1024);
  try { validateRelativePath(value); } catch { invalid(`Invalid ${label}`); }
  return value;
}
function stringList(value, label, maxCount = 32, maxLength = 500) {
  if (!Array.isArray(value) || value.length > maxCount) invalid(`Invalid ${label}`);
  const result = value.map((item) => text(item, label, maxLength));
  if (new Set(result).size !== result.length) invalid(`Duplicate ${label}`);
  return result;
}

export function validateGraveyardRecord(value, expectedId) {
  if (!value || Array.isArray(value) || typeof value !== "object") invalid();
  const allowed = new Set(["schemaVersion", "id", "name", "originalFunction", "reason", "evidence", "successor", "files", "recoveryRisks", "restorationSteps", "relatedIds"]);
  if (Object.keys(value).some((key) => !allowed.has(key)) || value.schemaVersion !== 1 || typeof value.id !== "string" || !ID.test(value.id) || (expectedId && value.id !== expectedId)) invalid();
  text(value.name, "name", 160);
  text(value.originalFunction, "original function", 2000);
  text(value.reason, "reason", 2000);
  if (!value.evidence || Array.isArray(value.evidence) || typeof value.evidence !== "object") invalid("Invalid evidence references");
  const evidenceKeys = new Set(["task", "audit", "hadesReport"]);
  if (Object.keys(value.evidence).some((key) => !evidenceKeys.has(key))) invalid("Invalid evidence references");
  ref(value.evidence.task, "task reference");
  ref(value.evidence.audit, "audit reference");
  ref(value.evidence.hadesReport, "Hades report reference");
  if (value.successor !== undefined && value.successor !== null) text(value.successor, "successor", 160);
  if (!Array.isArray(value.files) || !value.files.length || value.files.length > MAX_FILES) invalid("Invalid retirement descriptors");
  const seen = new Set();
  const beforePaths = new Set();
  const afterPaths = new Set();
  for (const file of value.files) {
    if (!file || Array.isArray(file) || typeof file !== "object" || Object.keys(file).some((key) => !["beforePath", "beforeBlob", "afterPath", "afterBlob", "symbols"].includes(key))) invalid("Invalid retirement descriptor");
    ref(file.beforePath, "original path");
    if (typeof file.beforeBlob !== "string" || !OID.test(file.beforeBlob)) invalid("Invalid original blob ID");
    if (file.afterPath !== null) ref(file.afterPath, "resulting path");
    if (file.afterBlob !== null && (typeof file.afterBlob !== "string" || !OID.test(file.afterBlob))) invalid("Invalid resulting blob ID");
    if ((file.afterPath === null) !== (file.afterBlob === null)) invalid("Deleted-file descriptor must use null path and blob");
    if (file.afterPath !== null && file.beforePath === file.afterPath && file.beforeBlob === file.afterBlob) invalid("Retirement descriptor does not describe a change");
    const key = `${file.beforePath}\0${file.afterPath ?? ""}`;
    if (seen.has(key)) invalid("Duplicate retirement descriptor");
    seen.add(key);
    if (beforePaths.has(file.beforePath) || (file.afterPath !== null && afterPaths.has(file.afterPath))) invalid("Ambiguous retirement descriptor path");
    beforePaths.add(file.beforePath);
    if (file.afterPath !== null) afterPaths.add(file.afterPath);
    file.symbols = stringList(file.symbols ?? [], "symbol", 64, 256);
  }
  stringList(value.recoveryRisks, "recovery risk", 32, 1000);
  stringList(value.restorationSteps, "restoration step", 32, 1000);
  if (value.relatedIds !== undefined) {
    if (!Array.isArray(value.relatedIds) || value.relatedIds.length > 32 || value.relatedIds.some((id) => typeof id !== "string" || !ID.test(id) || id === value.id) || new Set(value.relatedIds).size !== value.relatedIds.length) invalid("Invalid related IDs");
  }
  return value;
}

function git(root, args, { maxBuffer = LIMITS.gitOutputBytes, timeout = LIMITS.gitTimeoutMs, allowExit = [] } = {}) {
  try {
    const env = { GIT_OPTIONAL_LOCKS: "0", GIT_TERMINAL_PROMPT: "0", GIT_NO_REPLACE_OBJECTS: "1", GIT_NO_LAZY_FETCH: "1", GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: process.platform === "win32" ? "NUL" : "/dev/null" };
    for (const key of ["PATH", "SYSTEMROOT", "WINDIR", "PATHEXT"]) if (process.env[key]) env[key] = process.env[key];
    return execFileSync("git", ["-C", root, "--no-pager", "--no-lazy-fetch", "-c", "core.fsmonitor=false", "-c", "core.untrackedCache=false", ...args], { encoding: "buffer", stdio: ["ignore", "pipe", "pipe"], timeout, maxBuffer, windowsHide: true, env });
  } catch (error) {
    if (allowExit.includes(error.status)) return Buffer.alloc(0);
    if (error.code === "ENOBUFS") throw new Error("Git output exceeds graveyard limit");
    if (error.killed || error.code === "ETIMEDOUT") throw new Error("Git observation timed out");
    throw new Error("Git history/object unavailable");
  }
}
function gitText(root, args, opts) { return git(root, args, opts).toString("utf8").trim(); }
function parseTreeEntry(output) {
  if (!output.length) return null;
  const entry = output.toString("utf8").split("\0").filter(Boolean);
  if (entry.length !== 1) throw new Error("Ambiguous Git path entry");
  const match = /^(\d{6}) (blob|commit) ([a-f0-9]{40}|[a-f0-9]{64})\t([\s\S]+)$/.exec(entry[0]);
  if (!match) throw new Error("Malformed Git tree entry");
  if (match[2] !== "blob" || !["100644", "100755"].includes(match[1])) throw new Error("Symlink, submodule, or non-regular source is unsupported");
  return { mode: match[1], oid: match[3], path: match[4] };
}
function treeBlob(root, commit, relative) {
  const output = git(root, ["--literal-pathspecs", "ls-tree", "-z", commit, "--", relative], { maxBuffer: 4096, allowExit: [0] });
  const entry = parseTreeEntry(output);
  if (entry && entry.path !== relative) throw new Error("Git returned a non-literal path");
  return entry;
}
function parseParents(line) {
  const parts = line.trim().split(/\s+/);
  if (parts.length < 1 || !OID.test(parts[0]) || parts.slice(1).some((part) => !OID.test(part))) throw new Error("Malformed Git history response");
  return { commit: parts[0], parents: parts.slice(1) };
}

async function projectRoot(target) {
  const root = await realpath(target);
  const top = await realpath(gitText(root, ["rev-parse", "--show-toplevel"], { maxBuffer: 4096 }));
  if (top !== root) throw new Error("Target must be the Git worktree root");
  return root;
}
function relativeStatus(root, relative) {
  return git(root, ["--literal-pathspecs", "status", "--porcelain=v1", "-z", "--untracked-files=all", "--ignore-submodules=none", "--", relative], { maxBuffer: 4096 }).length > 0;
}
async function loadRecord(root, id) {
  if (typeof id !== "string" || !ID.test(id)) throw new Error("Invalid Graveyard ID");
  const relative = `${GRAVE_DIR}/${id}.json`;
  let absolute;
  try { absolute = await resolveContained(root, relative); }
  catch (error) {
    if (error.message === "Referenced path is unavailable") throw new Error("Graveyard record not found");
    throw error;
  }
  let handle;
  let bytes;
  try {
    handle = await open(absolute, constants.O_RDONLY | (constants.O_NOFOLLOW || 0));
    const info = await handle.stat();
    if (!info.isFile() || info.size > RECORD_BYTES) throw new Error("Graveyard record is not a bounded regular file");
    const buffer = Buffer.alloc(RECORD_BYTES + 1);
    let offset = 0;
    while (offset < buffer.length) {
      const { bytesRead } = await handle.read(buffer, offset, buffer.length - offset, offset);
      if (bytesRead === 0) break;
      offset += bytesRead;
    }
    if (offset > RECORD_BYTES) throw new Error("Graveyard record exceeds size limit");
    bytes = buffer.subarray(0, offset);
  } finally { await handle?.close(); }
  const value = parseBoundedJson(bytes, { maxBytes: RECORD_BYTES, validate: (record) => validateGraveyardRecord(record, id) });
  return { id, relative, absolute, bytes, value, dirty: relativeStatus(root, relative) };
}

async function listRecordIds(root) {
  let dir;
  try { dir = await resolveContained(root, GRAVE_DIR); }
  catch (error) {
    if (error.message === "Referenced path is unavailable") return [];
    throw new Error("Graveyard directory unavailable");
  }
  let info;
  try { info = await lstat(dir); } catch { throw new Error("Graveyard directory unavailable"); }
  if (!info.isDirectory() || info.isSymbolicLink()) throw new Error("Graveyard directory must be a real directory");
  const ids = [];
  const directory = await opendir(dir);
  let entries = 0;
  for await (const entry of directory) {
    if (++entries > MAX_RECORDS * 2) throw new Error("Graveyard directory entry count exceeds limit");
    if (entry.name.endsWith(".json")) ids.push(entry.name.slice(0, -5));
  }
  if (ids.length > MAX_RECORDS) throw new Error("Graveyard record count exceeds limit");
  if (ids.some((id) => !ID.test(id))) throw new Error("Invalid record filename in Graveyard");
  return ids.sort();
}

async function traceRecordUnchecked(root, record) {
  if (record.dirty) return { status: "PENDING", reason: "record_has_uncommitted_changes" };
  const current = treeBlob(root, "HEAD", record.relative);
  if (!current) return { status: "PENDING", reason: "record_not_committed" };
  if (current.mode !== "100644" || !record.bytes.equals(git(root, ["cat-file", "blob", current.oid], { maxBuffer: RECORD_BYTES }))) return { status: "PENDING", reason: "working_record_differs_from_HEAD" };
  const commits = gitText(root, ["--literal-pathspecs", "log", "--full-history", "-m", "--diff-filter=A", `--max-count=${MAX_HISTORY + 1}`, "--format=%H", "HEAD", "--", record.relative], { maxBuffer: 512 * 1024 }).split(/\s+/).filter(Boolean);
  if (commits.length > MAX_HISTORY) return { status: "TRACE_UNAVAILABLE", reason: "history_scan_limit_exceeded" };
  const additions = [];
  for (const commit of new Set(commits)) {
    const child = treeBlob(root, commit, record.relative);
    if (!child) continue;
    const { parents } = parseParents(gitText(root, ["rev-list", "--parents", "-n", "1", commit], { maxBuffer: 4096 }));
    if (parents.length === 0) additions.push({ commit, child, parents });
    else {
      const parentEntries = await Promise.all(parents.map((parent) => treeBlob(root, parent, record.relative)));
      if (parentEntries.every((entry) => !entry)) additions.push({ commit, child, parents });
    }
  }
  if (additions.length !== 1) return { status: "TRACE_UNAVAILABLE", reason: additions.length ? "ambiguous_record_introduction" : "record_introduction_not_reachable" };
  const introduction = additions[0];
  if (introduction.parents.length !== 1) return { status: "TRACE_UNAVAILABLE", reason: "record_introduction_has_no_unique_parent" };
  if (current.oid !== introduction.child.oid) return { status: "TRACE_UNAVAILABLE", reason: "record_changed_after_introduction" };
  const parent = introduction.parents[0];
  try {
    for (const file of record.value.files) {
      const before = treeBlob(root, parent, file.beforePath);
      if (!before || before.oid !== file.beforeBlob) throw new Error("before_blob_mismatch");
      if (file.afterPath === null) {
        if (treeBlob(root, introduction.commit, file.beforePath)) throw new Error("deleted_path_still_exists");
        continue;
      }
      const after = treeBlob(root, introduction.commit, file.afterPath);
      if (!after || after.oid !== file.afterBlob) throw new Error("after_blob_mismatch");
      if (file.beforePath !== file.afterPath && treeBlob(root, introduction.commit, file.beforePath)) throw new Error("rename_source_still_exists");
    }
  } catch (error) {
    return { status: "TRACE_UNAVAILABLE", reason: error.message.replace(/[^a-z0-9_]/gi, "_").slice(0, 80) };
  }
  const committedAt = gitText(root, ["show", "-s", "--format=%cI", introduction.commit], { maxBuffer: 4096 });
  return { status: "BURIED", commit: introduction.commit, parent, committedAt, files: record.value.files.map((file) => ({ beforePath: file.beforePath, beforeBlob: file.beforeBlob, afterPath: file.afterPath, afterBlob: file.afterBlob })) };
}

async function traceRecord(root, record) {
  try { return await traceRecordUnchecked(root, record); }
  catch (error) {
    const reason = error.message.includes("timed out") ? "git_observation_timed_out"
      : error.message.includes("limit") ? "git_history_or_output_limit_exceeded"
        : error.message.includes("Symlink") || error.message.includes("submodule") ? "unsupported_non_regular_history_entry"
          : "history_or_object_unavailable";
    return { status: "TRACE_UNAVAILABLE", reason };
  }
}

function summary(record, trace) {
  return { id: record.id, name: record.value.name, originalFunction: record.value.originalFunction, reason: record.value.reason, successor: record.value.successor ?? null, status: trace.status, ...(trace.reason ? { reasonCode: trace.reason } : {}), ...(trace.commit ? { commit: trace.commit, committedAt: trace.committedAt } : {}) };
}

export async function validateGraveyard(root, id) {
  const canonical = await projectRoot(root);
  if (id !== undefined) {
    const record = await loadRecord(canonical, id);
    const trace = await traceRecord(canonical, record);
    return { status: trace.status, record: summary(record, trace), trace };
  }
  const results = [];
  for (const item of await listRecordIds(canonical)) {
    try {
      const record = await loadRecord(canonical, item);
      const trace = await traceRecord(canonical, record);
      results.push(summary(record, trace));
    } catch (error) { results.push({ id: item, status: "INVALID", reasonCode: error.message.replace(/[^a-z0-9_]/gi, "_").slice(0, 80) }); }
  }
  const status = results.some((item) => item.status === "INVALID") ? "INVALID"
    : results.some((item) => item.status === "TRACE_UNAVAILABLE") ? "TRACE_UNAVAILABLE"
      : results.some((item) => item.status === "PENDING") ? "PENDING" : "OK";
  return { status, records: results };
}

export async function listGraveyard(root, query) {
  const canonical = await projectRoot(root);
  if (query !== undefined && (typeof query !== "string" || !query.trim() || query.length > 120)) throw new Error("Search query must be non-empty and within the 120-character limit");
  const needle = query?.toLowerCase();
  const records = [];
  for (const id of await listRecordIds(canonical)) {
    try {
      const record = await loadRecord(canonical, id);
      const trace = await traceRecord(canonical, record);
      const searchable = [record.value.name, record.value.originalFunction, record.value.reason, record.value.successor ?? "", ...record.value.files.flatMap((file) => [file.beforePath, file.afterPath ?? "", ...file.symbols])].join("\n").toLowerCase();
      if (!needle || searchable.includes(needle)) records.push(summary(record, trace));
    } catch (error) { records.push({ id, status: "INVALID", reasonCode: error.message.replace(/[^a-z0-9_]/gi, "_").slice(0, 80) }); }
  }
  return { status: "OK", records };
}

export async function inspectGraveyard(root, id) {
  const canonical = await projectRoot(root);
  const record = await loadRecord(canonical, id);
  const trace = await traceRecord(canonical, record);
  return { status: trace.status, record: record.value, trace };
}

async function retrieveFiles(root, record, trace) {
  if (trace.status !== "BURIED") throw new Error(`Cannot exhume: ${trace.status} (${trace.reason ?? "trace_unavailable"})`);
  const files = [];
  let total = 0;
  for (const descriptor of record.value.files) {
    const bytes = git(root, ["cat-file", "blob", descriptor.beforeBlob], { maxBuffer: MAX_FILE_BYTES });
    if (bytes.length > MAX_FILE_BYTES || (total += bytes.length) > MAX_EXPORT_BYTES) throw new Error("Exhumed content exceeds byte limit");
    assertNoSensitiveContent(bytes);
    files.push({ path: descriptor.beforePath, blob: descriptor.beforeBlob, bytes });
  }
  return files;
}

async function ensureDirectoryTree(root, relative) {
  const parts = relative.split("/");
  let cursor = root;
  for (const part of parts) {
    cursor = path.join(cursor, part);
    try {
      const info = await lstat(cursor);
      if (!info.isDirectory() || info.isSymbolicLink()) throw new Error("Export directory contains a link or non-directory");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      await mkdir(cursor, { mode: 0o700 });
      const info = await lstat(cursor);
      if (!info.isDirectory() || info.isSymbolicLink()) throw new Error("Unsafe export directory");
    }
  }
}

async function writeNewFile(root, relative, bytes, maxBytes) {
  if (bytes.length > maxBytes) throw new Error("Export file exceeds byte limit");
  const target = await resolveContained(root, relative, { allowMissing: true });
  let handle;
  try {
    handle = await open(target, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | (constants.O_NOFOLLOW || 0), 0o600);
    await handle.writeFile(bytes);
    await handle.close();
  } catch (error) {
    await handle?.close().catch(() => {});
    if (handle) await rm(target, { force: true }).catch(() => {});
    if (error.code === "EEXIST") throw new Error("Refusing to overwrite export content");
    throw new Error("Exclusive exhumation write failed");
  }
}

async function exportExhumation(root, record, trace, files) {
  const base = `${EXHUME_DIR}/${record.id}-${trace.commit.slice(0, 12)}`;
  await ensureDirectoryTree(root, EXHUME_DIR);
  const destination = await resolveContained(root, base, { allowMissing: true });
  let created = false;
  try {
    await mkdir(destination, { mode: 0o700 });
    created = true;
    for (const file of files) {
      const relative = `${base}/files/${file.path}`;
      await ensureDirectoryTree(root, path.posix.dirname(relative));
      await writeNewFile(root, relative, file.bytes, MAX_FILE_BYTES);
    }
    const receipt = {
      schemaVersion: 1,
      status: "EXHUMED",
      entry: `${GRAVE_DIR}/${record.id}.json`,
      commit: trace.commit,
      parent: trace.parent,
      files: files.map((file) => ({ path: file.path, blob: file.blob })),
      note: "Inspection export only; this does not restore the implementation."
    };
    await writeNewFile(root, `${base}/EXHUMED.json`, Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`), RECORD_BYTES);
    return { status: "EXHUMED", directory: base, receipt };
  } catch (error) {
    if (created) await rm(destination, { recursive: true, force: true }).catch(() => {});
    if (error.code === "EEXIST") throw new Error("Refusing to overwrite previous exhumation");
    throw error;
  }
}

export async function exhumeGraveyard(root, id, { exportFiles = false } = {}) {
  const canonical = await projectRoot(root);
  const record = await loadRecord(canonical, id);
  const trace = await traceRecord(canonical, record);
  const files = await retrieveFiles(canonical, record, trace);
  if (exportFiles) return { record: record.value, trace, ...(await exportExhumation(canonical, record, trace, files)) };
  const result = {
    status: "EXHUMED",
    record: record.value,
      trace: { status: trace.status, commit: trace.commit, parent: trace.parent, committedAt: trace.committedAt },
    files: files.map((file) => ({ path: file.path, blob: file.blob, bytes: file.bytes.length, base64: file.bytes.toString("base64") }))
  };
  if (Buffer.byteLength(JSON.stringify(result)) > MAX_EXHUME_OUTPUT_BYTES) throw new Error("Exhumation output exceeds byte limit; use --export");
  return result;
}
