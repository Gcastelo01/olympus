import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { chmod, cp, lstat, mkdtemp, mkdir, readFile, readdir, rm, symlink, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { observeGit, parseBoundedJson, readSafeReference, resolveContained, sanitizeProjectIdentity, validateId, validateRelativePath, writeExclusive } from "../src/state-primitives.mjs";

const git = (cwd, ...args) => execFileSync("git", ["-C", cwd, ...args], { stdio: "ignore" });
async function repository(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "olympus-state-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  git(root, "init", "-q");
  git(root, "config", "user.email", "offline@example.invalid");
  git(root, "config", "user.name", "Offline Test");
  await writeFile(path.join(root, "base.txt"), "base\n");
  git(root, "add", "base.txt");
  git(root, "commit", "-qm", "fixture");
  return root;
}

test("validates identifiers, portable paths, and bounded strict JSON", () => {
  assert.equal(validateId("task-1_A"), "task-1_A");
  for (const id of ["../x", "", ".", "a/b"]) assert.throws(() => validateId(id));
  assert.equal(validateRelativePath("knowledge/task.md"), "knowledge/task.md");
  for (const p of ["../x", "/etc/passwd", "C:/x", "\\\\host\\share", "a\\b", ".env", "x/id_rsa", "a\0b"]) assert.throws(() => validateRelativePath(p));
  assert.deepEqual(parseBoundedJson('{"ok":true}'), { ok: true });
  assert.throws(() => parseBoundedJson("{"));
  assert.throws(() => parseBoundedJson("12345", { maxBytes: 4 }));
  for (const value of [
    '{"password":"secret-value-that-should-not-leak"}',
    '{"nested":{"api_key":"secret-value-that-should-not-leak"}}',
    '{"access_token":"short"}',
    '{"password":"secret-value-that-should-not-leak","password":""}',
    JSON.stringify({ objective: 'Investigate password: "AUDIT_FAKE_PASSWORD_12345"' }),
    JSON.stringify({ nested: [{ note: "api_key=FAKE_AUDIT_KEY_123456789" }] }),
  ]) assert.throws(() => parseBoundedJson(value), (error) => !/(secret-value|AUDIT_FAKE_PASSWORD|FAKE_AUDIT_KEY)/.test(error.message));
});

test("rejects symlink ancestors and exclusive writes never overwrite", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "olympus-path-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, "inside"));
  await writeExclusive(root, "inside/new.json", "{}\n");
  await assert.rejects(writeExclusive(root, "inside/new.json", "overwritten"), /overwrite/);
  await assert.rejects(writeExclusive(root, "missing/target.json", "{}\n"), /Missing parent/);
  await assert.rejects(writeExclusive(root, "missing/nested/target.json", "{}\n"), /Missing parent/);
  await assert.rejects(resolveContained(root, "missing/target.json", { allowMissing: true }), /Missing parent/);
  await assert.rejects(lstat(path.join(root, "missing")));
  const outside = await mkdtemp(path.join(os.tmpdir(), "olympus-outside-"));
  t.after(() => rm(outside, { recursive: true, force: true }));
  await symlink(outside, path.join(root, "link"));
  await assert.rejects(resolveContained(root, "link/file.txt", { allowMissing: true }), /Symbolic/);
});

test("rejects secret-looking references without including values in errors", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "olympus-secret-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(root, "notes.txt"), "api_key=SUPER_SECRET_VALUE_12345");
  await assert.rejects(readSafeReference(root, "notes.txt"), (error) => !error.message.includes("SUPER_SECRET"));
  assert.equal(sanitizeProjectIdentity("https://user:secret@example.test/org/repo?token=private"), "https://example.test/org/repo");
  assert.equal(sanitizeProjectIdentity("ssh://user:password@example.test/org/repo.git"), "ssh://example.test/org/repo.git");
  assert.equal(sanitizeProjectIdentity("git@example.test:org/repo.git"), "ssh://example.test/org/repo.git");
  assert.equal(sanitizeProjectIdentity("other-user@example.test:org/repo.git"), undefined);
  assert.equal(sanitizeProjectIdentity("ssh://bad host/org/repo"), undefined);
});

test("screens recognizable GitHub and bearer credentials in text, escaped JSON, and artifacts without echoing values", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "olympus-secret-patterns-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const values = [
    "ghp_AUDIT_FAKE_TOKEN_1234567890",
    "gho_AUDIT_FAKE_TOKEN_1234567890",
    "ghu_AUDIT_FAKE_TOKEN_1234567890",
    "ghs_AUDIT_FAKE_TOKEN_1234567890",
    "ghr_AUDIT_FAKE_TOKEN_1234567890",
    "github_pat_AUDIT_FAKE_TOKEN_1234567890",
    "Authorization: Bearer AUDIT_FAKE_TOKEN_1234567890",
  ];
  for (const value of values) {
    assert.throws(() => parseBoundedJson(JSON.stringify({ objective: value })), (error) => !error.message.includes(value));
    await writeFile(path.join(root, "artifact.txt"), value);
    await assert.rejects(readSafeReference(root, "artifact.txt"), (error) => !error.message.includes(value));
  }

  const escapedToken = String.raw`{"objective":"ghp\u005fAUDIT_FAKE_TOKEN_1234567890"}`;
  assert.throws(() => parseBoundedJson(escapedToken), (error) => !error.message.includes("AUDIT_FAKE_TOKEN_1234567890"));
  const escapedBearer = String.raw`{"Authorization":"\u0042earer AUDIT_FAKE_TOKEN_1234567890"}`;
  assert.throws(() => parseBoundedJson(escapedBearer), (error) => !error.message.includes("AUDIT_FAKE_TOKEN_1234567890"));
  assert.deepEqual(parseBoundedJson('{"objective":"GitHub documents github_pat_ token formats"}'), { objective: "GitHub documents github_pat_ token formats" });
});

test("fingerprint detects unstaged, staged, untracked and same-status content edits", async (t) => {
  const root = await repository(t);
  const first = await observeGit(root);
  await writeFile(path.join(root, "base.txt"), "change one\n");
  const unstagedOne = await observeGit(root);
  assert.notEqual(first.workFingerprint, unstagedOne.workFingerprint);
  await writeFile(path.join(root, "base.txt"), "change two\n");
  const unstagedTwo = await observeGit(root);
  assert.notEqual(unstagedOne.workFingerprint, unstagedTwo.workFingerprint);
  git(root, "add", "base.txt");
  const staged = await observeGit(root);
  assert.notEqual(unstagedTwo.workFingerprint, staged.workFingerprint);
  await unlink(path.join(root, "base.txt"));
  const deleted = await observeGit(root);
  assert.notEqual(staged.workFingerprint, deleted.workFingerprint);
  await writeFile(path.join(root, "base.txt"), "change two\n");
  const restored = await observeGit(root);
  assert.notEqual(deleted.workFingerprint, restored.workFingerprint);
  await writeFile(path.join(root, "new.txt"), "untracked one");
  const untrackedOne = await observeGit(root);
  await writeFile(path.join(root, "new.txt"), "untracked two");
  const untrackedTwo = await observeGit(root);
  assert.notEqual(untrackedOne.workFingerprint, restored.workFingerprint);
  assert.notEqual(untrackedOne.workFingerprint, untrackedTwo.workFingerprint);
  await mkdir(path.join(root, ".olympus/context"), { recursive: true });
  await writeFile(path.join(root, ".olympus/context/tmp.json"), "{}\n");
  assert.equal((await observeGit(root)).workFingerprint, untrackedTwo.workFingerprint);
});

test("reports detached failures safely and requires the worktree root", async (t) => {
  const root = await repository(t);
  await assert.rejects(observeGit(path.join(root, "subdirectory")));
  assert.equal(typeof (await observeGit(root)).head, "string");
  git(root, "checkout", "--detach", "HEAD");
  assert.equal((await observeGit(root)).branch, "DETACHED");
  const nonRepository = await mkdtemp(path.join(os.tmpdir(), "olympus-nogit-"));
  t.after(() => rm(nonRepository, { recursive: true, force: true }));
  await assert.rejects(observeGit(nonRepository), /^Error: Git observation failed$/);
});

test("project identity follows sanitized remote and history anchors rather than local paths", async (t) => {
  const first = await repository(t);
  const copyParent = await mkdtemp(path.join(os.tmpdir(), "olympus-copy-"));
  t.after(() => rm(copyParent, { recursive: true, force: true }));
  const copy = path.join(copyParent, "checkout");
  await cp(first, copy, { recursive: true });
  const localA = await observeGit(first);
  const localB = await observeGit(copy);
  assert.equal(localA.projectId, localB.projectId);
  assert.equal(localA.identityProvenance, "local-history-weaker");
  assert.ok(!localA.projectId.includes(first));

  const remote = "ssh://user:secret@example.invalid/org/project.git";
  git(first, "remote", "add", "origin", remote);
  git(copy, "remote", "add", "origin", "ssh://other:credential@example.invalid/org/project.git");
  assert.equal((await observeGit(first)).projectId, (await observeGit(copy)).projectId);

  const independent = await mkdtemp(path.join(os.tmpdir(), "olympus-independent-"));
  t.after(() => rm(independent, { recursive: true, force: true }));
  git(independent, "init", "-q");
  git(independent, "config", "user.email", "offline@example.invalid");
  git(independent, "config", "user.name", "Offline Test");
  await writeFile(path.join(independent, "independent.txt"), "different root\n");
  git(independent, "add", "independent.txt");
  git(independent, "commit", "-qm", "independent root");
  git(independent, "remote", "add", "origin", remote);
  assert.notEqual((await observeGit(first)).projectId, (await observeGit(independent)).projectId);
});

test("repository fsmonitor configuration is never executed", async (t) => {
  const root = await repository(t);
  const marker = path.join(root, "fsmonitor-marker.txt");
  const script = path.join(root, ".git", "fsmonitor-fixture.js");
  await writeFile(script, `#!/usr/bin/env node\nrequire('node:fs').writeFileSync(${JSON.stringify(marker)}, 'executed');\n`);
  await chmod(script, 0o700);
  git(root, "config", "core.fsmonitor", `!${JSON.stringify(process.execPath)} ${JSON.stringify(script)}`);
  await observeGit(root);
  await assert.rejects(lstat(marker));
});

test("Git observation fails closed without lazy-fetch helper or repository writes", async (t) => {
  if (process.platform === "win32") return t.skip("synthetic executable Git remote helper uses POSIX script");
  const root = await repository(t);
  const oid = execFileSync("git", ["-C", root, "rev-parse", "HEAD^{tree}"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  await unlink(path.join(root, ".git", "objects", oid.slice(0, 2), oid.slice(2)));
  git(root, "config", "extensions.partialClone", "origin");
  git(root, "config", "remote.origin.promisor", "true");
  git(root, "config", "remote.origin.url", "olympus-test::offline");

  const helperDir = path.join(root, "helper-bin");
  const marker = path.join(root, "fetch.marker");
  const helper = path.join(helperDir, "git-remote-olympus-test");
  await mkdir(helperDir);
  const quote = (value) => `'${value.replaceAll("'", "'\\''")}'`;
  await writeFile(helper, `#!/bin/sh\nprintf fetched > ${quote(marker)}\nexit 1\n`);
  await chmod(helper, 0o700);

  const originalPath = process.env.PATH;
  process.env.PATH = `${helperDir}${path.delimiter}${originalPath ?? ""}`;
  const indexBefore = await readFile(path.join(root, ".git", "index"));
  const configBefore = await readFile(path.join(root, ".git", "config"));
  const objectFiles = async () => {
    const found = [];
    const visit = async (directory, relative = "") => {
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        const item = path.join(relative, entry.name);
        if (entry.isDirectory()) await visit(path.join(directory, entry.name), item);
        else found.push(item);
      }
    };
    await visit(path.join(root, ".git", "objects"));
    return found.sort();
  };
  const objectsBefore = await objectFiles();
  try {
    await assert.rejects(observeGit(root), /Git observation failed|Git output exceeds size limit/);
    await assert.rejects(readFile(marker), { code: "ENOENT" });
    assert.deepEqual(await objectFiles(), objectsBefore);
    assert.deepEqual(await readFile(path.join(root, ".git", "index")), indexBefore);
    assert.deepEqual(await readFile(path.join(root, ".git", "config")), configBefore);
    assert.equal(await readFile(path.join(root, "base.txt"), "utf8"), "base\n");
    await assert.rejects(lstat(path.join(root, ".olympus")), { code: "ENOENT" });
  } finally {
    if (originalPath === undefined) delete process.env.PATH;
    else process.env.PATH = originalPath;
  }
});

test("oversized Git configuration output fails closed", async (t) => {
  const root = await repository(t);
  git(root, "remote", "add", "origin", `https://example.invalid/${"a".repeat(5000)}`);
  await assert.rejects(observeGit(root), /output exceeds size limit/);
});
