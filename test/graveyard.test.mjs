import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { closeSync, openSync } from "node:fs";
import { chmod, mkdtemp, mkdir, readFile, rename, rm, symlink, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exhumeGraveyard, explainRetiredReferences, inspectGraveyard, listGraveyard, validateGraveyard } from "../src/graveyard.mjs";

const run = (cwd, args) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

async function emptyRepoFixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "olympus-grave-empty-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  run(root, ["init", "-q"]);
  run(root, ["config", "user.name", "Test"]);
  run(root, ["config", "user.email", "test@example.invalid"]);
  await writeFile(path.join(root, "README.md"), "fixture\n");
  run(root, ["add", "--", "README.md"]);
  run(root, ["commit", "-qm", "empty project"]);
  return root;
}

async function repoFixture(t, { initial = "old implementation\n", next = "replacement implementation\n", rename = false, badBefore = false, rootRecord = false, relatedIds = [], oldPath = "src/legacy.mjs" } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "olympus-grave-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  run(root, ["init", "-q"]);
  run(root, ["branch", "-M", "source"]);
  run(root, ["config", "user.name", "Test"]);
  run(root, ["config", "user.email", "test@example.invalid"]);
  const newPath = rename ? "src/current.mjs" : oldPath;
  await mkdir(path.join(root, "src"), { recursive: true });
  await writeFile(path.join(root, oldPath), initial);
  run(root, ["add", "--", oldPath]);
  run(root, ["commit", "-qm", "initial implementation"]);
  const before = run(root, ["rev-parse", `HEAD:${oldPath}`]);
  await mkdir(path.join(root, "knowledge", "graveyard"), { recursive: true });
  if (rename) {
    await rm(path.join(root, oldPath));
    await writeFile(path.join(root, newPath), next);
  } else if (next === null) await rm(path.join(root, oldPath));
  else await writeFile(path.join(root, oldPath), next);
  const after = next === null ? null : run(root, ["hash-object", "--", newPath]);
  const record = {
    schemaVersion: 1,
    id: "GRAVE-001",
    name: "Legacy implementation",
    originalFunction: "Handled the previous protocol behavior.",
    reason: "Replaced by the current module.",
    evidence: { task: "knowledge/tasks/retire.md", audit: "knowledge/audits/retire.md", hadesReport: "knowledge/reviews/hades.md" },
    successor: "Current implementation",
    files: [{ beforePath: oldPath, beforeBlob: badBefore ? "0".repeat(before.length) : before, afterPath: next === null ? null : newPath, afterBlob: after, symbols: ["legacyHandler"] }],
    recoveryRisks: ["Depends on old protocol contracts."],
    restorationSteps: ["Review current interfaces before adapting."],
    relatedIds
  };
  const recordPath = path.join(root, "knowledge", "graveyard", "GRAVE-001.json");
  await writeFile(recordPath, `${JSON.stringify(record, null, 2)}\n`);
  if (rootRecord) {
    run(root, ["checkout", "--orphan", "root-retirement"]);
    run(root, ["add", "-A", "--", oldPath, newPath, "knowledge/graveyard/GRAVE-001.json"]);
    run(root, ["commit", "-qm", "root retirement"]);
  } else {
    run(root, ["add", "-A", "--", oldPath, newPath, "knowledge/graveyard/GRAVE-001.json"]);
    run(root, ["commit", "-qm", "retire implementation"]);
  }
  return { root, record, recordPath, oldPath, newPath, initial, next };
}

test("verifies a same-commit retirement and exhumes original bytes without changing application or HEAD", async (t) => {
  const { root, oldPath, initial, next } = await repoFixture(t);
  const head = run(root, ["rev-parse", "HEAD"]);
  const current = await readFile(path.join(root, oldPath), "utf8");
  const status = run(root, ["status", "--porcelain=v1"]);
  const inspected = await inspectGraveyard(root, "GRAVE-001");
  assert.equal(inspected.status, "BURIED");
  assert.equal(inspected.trace.parent, run(root, ["rev-parse", "HEAD^"]));
  assert.match(inspected.trace.committedAt, /^\d{4}-\d\d-\d\dT/);
  const exhumed = await exhumeGraveyard(root, "GRAVE-001");
  assert.equal(Buffer.from(exhumed.files[0].base64, "base64").toString("utf8"), initial);
  assert.equal(await readFile(path.join(root, oldPath), "utf8"), current);
  assert.equal(current, next);
  assert.equal(run(root, ["rev-parse", "HEAD"]), head);
  assert.equal(run(root, ["status", "--porcelain=v1"]), status);
});

test("exports files and receipt exclusively under .olympus/exhumed and rejects a repeat collision", async (t) => {
  const { root, oldPath, initial } = await repoFixture(t);
  const first = await exhumeGraveyard(root, "GRAVE-001", { exportFiles: true });
  assert.equal(first.status, "EXHUMED");
  assert.equal(first.receipt.status, "EXHUMED");
  const exported = await readFile(path.join(root, first.directory, "files", oldPath), "utf8");
  assert.equal(exported, initial);
  await assert.rejects(exhumeGraveyard(root, "GRAVE-001", { exportFiles: true }), /Refusing to overwrite previous exhumation/);
  assert.equal(await readFile(path.join(root, first.directory, "files", oldPath), "utf8"), initial);
});

test("reports changed descriptors as TRACE_UNAVAILABLE", async (t) => {
  const { root } = await repoFixture(t, { badBefore: true });
  const result = await validateGraveyard(root, "GRAVE-001");
  assert.equal(result.status, "TRACE_UNAVAILABLE");
  assert.equal(result.trace.reason, "before_blob_mismatch");
  await assert.rejects(exhumeGraveyard(root, "GRAVE-001"), /Cannot exhume/);
});

test("supports explicit rename descriptors and reports partial-symbol scope without claiming AST proof", async (t) => {
  const { root, oldPath, newPath, initial } = await repoFixture(t, { rename: true, next: "replacement with a retained helper\n" });
  const result = await inspectGraveyard(root, "GRAVE-001");
  assert.equal(result.status, "BURIED", JSON.stringify(result.trace));
  assert.equal(result.record.files[0].beforePath, oldPath);
  assert.equal(result.record.files[0].afterPath, newPath);
  assert.deepEqual(result.record.files[0].symbols, ["legacyHandler"]);
  const exhumed = await exhumeGraveyard(root, "GRAVE-001");
  assert.equal(Buffer.from(exhumed.files[0].base64, "base64").toString("utf8"), initial);
});

test("uncommitted and malformed entries cannot claim BURIED", async (t) => {
  const { root, recordPath } = await repoFixture(t);
  await writeFile(recordPath, `${JSON.stringify({ ...JSON.parse(await readFile(recordPath, "utf8")), reason: "edited after commit" })}\n`);
  assert.equal((await validateGraveyard(root, "GRAVE-001")).status, "PENDING");
  await writeFile(recordPath, "{not-json\n");
  await assert.rejects(inspectGraveyard(root, "GRAVE-001"), /Invalid JSON/);
});

test("root introduction has no usable parent and remains unavailable", async (t) => {
  const { root } = await repoFixture(t, { rootRecord: true });
  const result = await validateGraveyard(root, "GRAVE-001");
  assert.equal(result.status, "TRACE_UNAVAILABLE");
  assert.equal(result.trace.reason, "record_introduction_has_no_unique_parent");
});

test("list and search are deterministic and bounded to validated record metadata", async (t) => {
  const { root } = await repoFixture(t);
  assert.equal((await listGraveyard(root)).records[0].status, "BURIED");
  assert.equal((await listGraveyard(root, "legacyHandler")).records.length, 1);
  assert.equal((await listGraveyard(root, "not present")).records.length, 0);
  await assert.rejects(listGraveyard(root, "x".repeat(121)), /120-character limit/);
});

test("a deleted file descriptor resolves only when the resulting tree has no file at that path", async (t) => {
  const { root } = await repoFixture(t, { next: null });
  const result = await inspectGraveyard(root, "GRAVE-001");
  assert.equal(result.status, "BURIED");
  const exhumed = await exhumeGraveyard(root, "GRAVE-001");
  assert.equal(exhumed.files.length, 1);
});

test("does not choose between multiple reachable introductions of a reused stable ID", async (t) => {
  const { root, recordPath } = await repoFixture(t);
  const recordBytes = await readFile(recordPath, "utf8");
  run(root, ["rm", "--", "knowledge/graveyard/GRAVE-001.json"]);
  run(root, ["commit", "-qm", "remove old catalog entry"]);
  await mkdir(path.dirname(recordPath), { recursive: true });
  await writeFile(recordPath, `${JSON.stringify(JSON.parse(recordBytes), null, 2)}\n`);
  run(root, ["add", "--", "knowledge/graveyard/GRAVE-001.json"]);
  run(root, ["commit", "-qm", "reintroduce catalog entry"]);
  const result = await validateGraveyard(root, "GRAVE-001");
  assert.equal(result.status, "TRACE_UNAVAILABLE");
  assert.equal(result.trace.reason, "ambiguous_record_introduction");
});

test("resolves an accessible rewritten history by tree descriptors, not a stored commit SHA", async (t) => {
  const { root } = await repoFixture(t);
  const oldHead = run(root, ["rev-parse", "HEAD"]);
  run(root, ["commit", "--amend", "-qm", "rewritten retirement commit"]);
  const newHead = run(root, ["rev-parse", "HEAD"]);
  assert.notEqual(newHead, oldHead);
  const result = await validateGraveyard(root, "GRAVE-001");
  assert.equal(result.status, "BURIED");
  assert.equal(result.trace.commit, newHead);
});

test("ignores local Git replace refs when verifying and retrieving retired blobs", async (t) => {
  const { root, oldPath, initial } = await repoFixture(t);
  const record = JSON.parse(await readFile(path.join(root, "knowledge", "graveyard", "GRAVE-001.json"), "utf8"));
  const replacementPath = path.join(root, "src", "replacement-object.txt");
  await writeFile(replacementPath, "replace-ref substitution\n");
  const replacementBlob = run(root, ["hash-object", "-w", "--", replacementPath]);
  run(root, ["replace", record.files[0].beforeBlob, replacementBlob]);
  const result = await exhumeGraveyard(root, "GRAVE-001");
  assert.equal(result.status, "EXHUMED");
  assert.equal(Buffer.from(result.files[0].base64, "base64").toString("utf8"), initial);
  assert.equal(await readFile(path.join(root, oldPath), "utf8"), "replacement implementation\n");
});

test("does not invoke a promisor remote helper for missing historical blobs", async (t) => {
  if (process.platform === "win32") return t.skip("synthetic executable Git remote helper uses a POSIX script");
  const { root, record } = await repoFixture(t);
  const oid = record.files[0].beforeBlob;
  await unlink(path.join(root, ".git", "objects", oid.slice(0, 2), oid.slice(2)));
  run(root, ["config", "extensions.partialClone", "origin"]);
  run(root, ["config", "remote.origin.promisor", "true"]);
  run(root, ["config", "remote.origin.url", "olympus-test::offline"]);

  const helperDir = path.join(root, "helper-bin");
  const marker = path.join(root, "fetch.marker");
  const helper = path.join(helperDir, "git-remote-olympus-test");
  await mkdir(helperDir);
  const quote = (value) => `'${value.replaceAll("'", "'\\''")}'`;
  await writeFile(helper, `#!/bin/sh\nprintf fetched > ${quote(marker)}\nexit 1\n`);
  await chmod(helper, 0o700);
  const originalPath = process.env.PATH;
  process.env.PATH = `${helperDir}${path.delimiter}${originalPath ?? ""}`;
  try {
    const controlEnv = { ...process.env, GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: "/dev/null" };
    delete controlEnv.GIT_NO_LAZY_FETCH;
    assert.throws(() => execFileSync("git", ["-C", root, "cat-file", "blob", oid], { stdio: ["ignore", "pipe", "pipe"], env: controlEnv }));
    await readFile(marker);
    await unlink(marker);
    await assert.rejects(exhumeGraveyard(root, "GRAVE-001"), /Git history\/object unavailable/);
    await assert.rejects(readFile(marker), { code: "ENOENT" });
  } finally {
    if (originalPath === undefined) delete process.env.PATH;
    else process.env.PATH = originalPath;
  }
});

test("resolves a cherry-picked retirement after the original commit becomes unreachable", async (t) => {
  const { root } = await repoFixture(t);
  const retirement = run(root, ["rev-parse", "HEAD"]);
  const base = run(root, ["rev-parse", "HEAD^"]);
  run(root, ["branch", "destination", base]);
  run(root, ["checkout", "destination"]);
  run(root, ["cherry-pick", retirement]);
  run(root, ["branch", "-D", "source"]);
  const result = await validateGraveyard(root, "GRAVE-001");
  assert.equal(result.status, "BURIED");
  assert.equal(result.trace.commit, run(root, ["rev-parse", "HEAD"]));
});

test("a shallow clone without the record parent cannot claim BURIED", async (t) => {
  const { root } = await repoFixture(t);
  const clone = path.join(path.dirname(root), `${path.basename(root)}-shallow`);
  t.after(() => rm(clone, { recursive: true, force: true }));
  run(root, ["clone", "--depth", "1", `file://${root}`, clone]);
  const result = await validateGraveyard(clone, "GRAVE-001");
  assert.equal(result.status, "TRACE_UNAVAILABLE");
  assert.equal(result.trace.reason, "record_introduction_has_no_unique_parent");
});

test("rejects traversal descriptors and symlinked export directories", async (t) => {
  const { root, recordPath } = await repoFixture(t);
  const record = JSON.parse(await readFile(recordPath, "utf8"));
  record.files[0].beforePath = "../../outside.mjs";
  await writeFile(recordPath, `${JSON.stringify(record)}\n`);
  await assert.rejects(inspectGraveyard(root, "GRAVE-001"), /Invalid original path/);

  const second = await repoFixture(t);
  const outside = path.join(path.dirname(second.root), `${path.basename(second.root)}-outside`);
  await mkdir(outside);
  t.after(() => rm(outside, { recursive: true, force: true }));
  await mkdir(path.join(second.root, ".olympus"), { recursive: true });
  await symlink(outside, path.join(second.root, ".olympus", "exhumed"));
  await assert.rejects(exhumeGraveyard(second.root, "GRAVE-001", { exportFiles: true }), /link or non-directory/);
  assert.deepEqual(await (await import("node:fs/promises")).readdir(outside), []);

  const third = await repoFixture(t);
  const externalKnowledge = path.join(path.dirname(third.root), `${path.basename(third.root)}-knowledge`);
  await rename(path.join(third.root, "knowledge"), externalKnowledge);
  t.after(() => rm(externalKnowledge, { recursive: true, force: true }));
  await symlink(externalKnowledge, path.join(third.root, "knowledge"));
  await assert.rejects(listGraveyard(third.root), /Graveyard directory unavailable/);
});

test("treats Git pathspec-looking filenames literally", async (t) => {
  if (process.platform === "win32") return t.skip("colon path components are not portable to Windows");
  const pathspecFile = "src/:(glob)legacy.mjs";
  const { root, initial } = await repoFixture(t, { oldPath: pathspecFile });
  const result = await exhumeGraveyard(root, "GRAVE-001");
  assert.equal(result.status, "EXHUMED");
  assert.equal(result.files[0].path, pathspecFile);
  assert.equal(Buffer.from(result.files[0].base64, "base64").toString("utf8"), initial);
});

test("resolves related records for one logical removal split across commits", async (t) => {
  const { root } = await repoFixture(t, { relatedIds: ["GRAVE-002"] });
  const secondPath = "src/legacy-second.mjs";
  await writeFile(path.join(root, secondPath), "old second module\n");
  run(root, ["add", "--", secondPath]);
  run(root, ["commit", "-qm", "add second legacy module"]);
  const beforeBlob = run(root, ["rev-parse", `HEAD:${secondPath}`]);
  await writeFile(path.join(root, secondPath), "second module replacement\n");
  const afterBlob = run(root, ["hash-object", "--", secondPath]);
  const linked = {
    schemaVersion: 1,
    id: "GRAVE-002",
    name: "Second legacy component",
    originalFunction: "Handled a related legacy code path.",
    reason: "Retired in a follow-up commit.",
    evidence: { task: "knowledge/tasks/retire.md", audit: "knowledge/audits/retire.md", hadesReport: "knowledge/reviews/hades.md" },
    successor: null,
    files: [{ beforePath: secondPath, beforeBlob, afterPath: secondPath, afterBlob, symbols: ["secondHandler"] }],
    recoveryRisks: ["Uses the previous contract."],
    restorationSteps: ["Review the current contract."],
    relatedIds: ["GRAVE-001"]
  };
  await writeFile(path.join(root, "knowledge", "graveyard", "GRAVE-002.json"), `${JSON.stringify(linked, null, 2)}\n`);
  run(root, ["add", "--", secondPath, "knowledge/graveyard/GRAVE-002.json"]);
  run(root, ["commit", "-qm", "retire related component"]);
  assert.equal((await inspectGraveyard(root, "GRAVE-001")).status, "BURIED");
  assert.equal((await inspectGraveyard(root, "GRAVE-002")).status, "BURIED");
  assert.deepEqual((await inspectGraveyard(root, "GRAVE-002")).record.relatedIds, ["GRAVE-001"]);
});

test("treats a missing registry as empty for list/search/validate and clear not-found for ID commands", async (t) => {
  const root = await emptyRepoFixture(t);
  assert.deepEqual(await listGraveyard(root), { status: "OK", records: [] });
  assert.deepEqual(await listGraveyard(root, "missing"), { status: "OK", records: [] });
  assert.deepEqual(await validateGraveyard(root), { status: "OK", records: [] });
  await assert.rejects(inspectGraveyard(root, "GRAVE-001"), /Graveyard record not found/);
  await assert.rejects(exhumeGraveyard(root, "GRAVE-001"), /Graveyard record not found/);

  const cli = fileURLToPath(new URL("../bin/olympus.mjs", import.meta.url));
  for (const command of ["list", "validate", "search"]) {
    const outputPath = path.join(root, `.graveyard-cli-${command}.json`);
    const outputFd = openSync(outputPath, "w");
    const commandArgs = command === "search" ? ["router"] : [];
    try { execFileSync(process.execPath, [cli, "graveyard", command, ...commandArgs, "--target", root], { stdio: ["ignore", outputFd, outputFd] }); }
    finally { closeSync(outputFd); }
    const output = await readFile(outputPath, "utf8");
    await rm(outputPath, { force: true });
    let result;
    try { result = JSON.parse(output); } catch { assert.fail(`CLI ${command} returned non-JSON output: ${JSON.stringify(output)}`); }
    assert.deepEqual(result, { status: "OK", records: [] });
  }
  for (const command of ["inspect", "exhume"]) {
    const outputPath = path.join(root, `.graveyard-cli-${command}.txt`);
    const outputFd = openSync(outputPath, "w");
    try {
      assert.throws(() => execFileSync(process.execPath, [cli, "graveyard", command, "GRAVE-001", "--target", root], { stdio: ["ignore", outputFd, outputFd] }));
    } finally { closeSync(outputFd); }
    const output = await readFile(outputPath, "utf8");
    await rm(outputPath, { force: true });
    assert.match(output, /Graveyard record not found/);
    assert.doesNotMatch(output, /Unknown argument/);
  }
});

test("fails closed when Git does not support --no-lazy-fetch", async (t) => {
  if (process.platform === "win32") return t.skip("synthetic Git wrapper uses POSIX shell");
  const root = await emptyRepoFixture(t);
  const helperDir = path.join(root, "old-git-bin");
  await mkdir(helperDir);
  const marker = path.join(root, "unexpected-fetch.marker");
  const gitWrapper = path.join(helperDir, "git");
  await writeFile(gitWrapper, `#!/bin/sh\ncase " $* " in *" --no-lazy-fetch "*) echo 'unknown option --no-lazy-fetch' >&2; exit 129;; esac\nexit 99\n`);
  await chmod(gitWrapper, 0o700);
  const originalPath = process.env.PATH;
  process.env.PATH = `${helperDir}${path.delimiter}${originalPath ?? ""}`;
  try {
    await assert.rejects(inspectGraveyard(root, "GRAVE-001"), /Git history\/object unavailable/);
    await assert.rejects(readFile(marker), { code: "ENOENT" });
  } finally {
    if (originalPath === undefined) delete process.env.PATH;
    else process.env.PATH = originalPath;
  }
});

test("preserves documented Graveyard CLI exit codes for every validation state", async (t) => {
  const cli = fileURLToPath(new URL("../bin/olympus.mjs", import.meta.url));
  const invoke = async (root, args, label) => {
    const outputPath = path.join(root, `.graveyard-exit-${label}.json`);
    const outputFd = openSync(outputPath, "w");
    let status = 0;
    try {
      try { execFileSync(process.execPath, [cli, "graveyard", ...args, "--target", root, "--json"], { stdio: ["ignore", outputFd, outputFd] }); }
      catch (error) { status = error.status; }
    } finally { closeSync(outputFd); }
    const output = await readFile(outputPath, "utf8");
    await rm(outputPath, { force: true });
    return { status, result: JSON.parse(output) };
  };

  const pending = await repoFixture(t);
  const record = JSON.parse(await readFile(pending.recordPath, "utf8"));
  await writeFile(pending.recordPath, `${JSON.stringify({ ...record, reason: "locally edited" })}\n`);
  const pendingResult = await invoke(pending.root, ["validate", "GRAVE-001"], "pending");
  assert.equal(pendingResult.status, 4);
  assert.equal(pendingResult.result.status, "PENDING");

  const unavailable = await repoFixture(t, { rootRecord: true });
  const unavailableResult = await invoke(unavailable.root, ["inspect", "GRAVE-001"], "unavailable");
  assert.equal(unavailableResult.status, 4);
  assert.equal(unavailableResult.result.status, "TRACE_UNAVAILABLE");

  const invalid = await repoFixture(t);
  await writeFile(path.join(invalid.root, "knowledge", "graveyard", "GRAVE-002.json"), "{malformed\n");
  const invalidResult = await invoke(invalid.root, ["validate"], "invalid");
  assert.equal(invalidResult.status, 5);
  assert.equal(invalidResult.result.status, "INVALID");

  const valid = await repoFixture(t);
  const validResult = await invoke(valid.root, ["validate", "GRAVE-001"], "valid");
  assert.equal(validResult.status, 0);
  assert.equal(validResult.result.status, "BURIED");
});

test("bounded registry reads reject FIFO, directory, symlink, and oversized records", async (t) => {
  if (process.platform === "win32") return t.skip("FIFO fixture requires POSIX mkfifo");
  const root = await emptyRepoFixture(t);
  const directory = path.join(root, "knowledge", "graveyard");
  await mkdir(directory, { recursive: true });
  await mkdir(path.join(directory, "GRAVE-101.json"));
  const outside = path.join(root, "outside.json");
  await writeFile(outside, "{}");
  await symlink(outside, path.join(directory, "GRAVE-102.json"));
  await writeFile(path.join(directory, "GRAVE-103.json"), "x".repeat(65 * 1024));
  const fifo = path.join(directory, "GRAVE-104.json");
  execFileSync("mkfifo", [fifo], { timeout: 2000, stdio: "ignore" });

  const report = await validateGraveyard(root);
  assert.equal(report.status, "INVALID");
  assert.deepEqual(report.records.map((record) => record.id), ["GRAVE-101", "GRAVE-102", "GRAVE-103", "GRAVE-104"]);
  assert.ok(report.records.every((record) => record.status === "INVALID"));
  const hints = await explainRetiredReferences(root, [{ path: "legacy.mjs", observed: "missing" }]);
  assert.equal(hints.status, "INVALID");
  assert.ok(hints.issues.every((issue) => issue.status === "INVALID"));
});
