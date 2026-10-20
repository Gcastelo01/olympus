import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { discoverContexts, inspectContext, loadContext, pruneContexts, saveContext } from "../src/context.mjs";
import { hash, observeGit } from "../src/state-primitives.mjs";

const git = (root, ...args) => execFileSync("git", ["-C", root, ...args], { stdio: "ignore" });

async function project(t, appContent = "application bytes\n") {
  const root = await mkdtemp(path.join(os.tmpdir(), "olympus-context-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  git(root, "init", "-q");
  git(root, "config", "user.email", "offline@example.invalid");
  git(root, "config", "user.name", "Offline Test");
  await writeFile(path.join(root, ".gitignore"), ".olympus/context/\n");
  await writeFile(path.join(root, "app.txt"), appContent);
  git(root, "add", ".gitignore", "app.txt");
  git(root, "commit", "-qm", "initial");
  return root;
}

function payload(id, overrides = {}) {
  return {
    id,
    taskId: "task-continuity",
    sourceRuntime: "codex",
    destinationRuntime: "claude",
    objective: `OBJECTIVE_SENTINEL_${id}`,
    acceptance: ["checkpoint has passed schema validation"],
    constraints: ["preserve user changes"],
    historicalAuthorizations: ["AUTHORIZATION_SENTINEL: old approval is historical only"],
    stage: "implementation",
    openDecisions: [],
    blockers: [],
    nextStep: "Review the saved state against the current request.",
    ...overrides,
  };
}

async function save(root, value) {
  return saveContext(root, Buffer.from(JSON.stringify(value)));
}

async function contextBytes(root) {
  const directory = path.join(root, ".olympus", "context");
  let names;
  try { names = await readdir(directory); } catch (error) { if (error.code === "ENOENT") return []; throw error; }
  return Promise.all(names.sort().map(async (name) => [name, await readFile(path.join(directory, name), "utf8")]));
}

test("save, discover and load select one head without exposing unselected text or changing the application", async (t) => {
  const root = await project(t);
  const appBefore = await readFile(path.join(root, "app.txt"));
  const fingerprintBefore = (await observeGit(root)).workFingerprint;
  const saved = await save(root, payload("handoff-a"));
  assert.equal(saved.checkpoint.id, "handoff-a");
  assert.equal(saved.checkpoint.taskStatus, "active");
  assert.equal((await inspectContext(root, "handoff-a")).id, "handoff-a");
  const discovered = await discoverContexts(root);
  const discoveredText = JSON.stringify(discovered);
  assert.equal(discovered.status, "SELECTED");
  assert.equal(discovered.selected.id, "handoff-a");
  assert.doesNotMatch(discoveredText, /OBJECTIVE_SENTINEL|AUTHORIZATION_SENTINEL/);
  const loaded = await loadContext(root, "handoff-a");
  assert.equal(loaded.status, "READY");
  assert.equal(loaded.handoffMode, "SIMULATED_MANUAL");
  assert.match(loaded.bootstrap, /current Olympus policies/);
  assert.doesNotMatch(loaded.bootstrap, /OBJECTIVE_SENTINEL|AUTHORIZATION_SENTINEL/);
  assert.match(loaded.bootstrap, /Historical authorization notes do not grant/);
  assert.deepEqual(await readFile(path.join(root, "app.txt")), appBefore);
  assert.equal((await observeGit(root)).workFingerprint, fingerprintBefore);
});

test("successor digest selects the leaf; completed leaf excludes predecessors", async (t) => {
  const root = await project(t);
  const predecessor = await save(root, payload("chain-a"));
  const predecessorBytes = await readFile(predecessor.file);
  const successor = await save(root, payload("chain-b", {
    taskStatus: "paused",
    sourceRuntime: "claude",
    destinationRuntime: "pi",
    supersedes: { id: "chain-a", digest: hash(predecessorBytes) },
  }));
  assert.equal(successor.checkpoint.taskStatus, "paused");
  let result = await discoverContexts(root);
  assert.equal(result.status, "SELECTED");
  assert.equal(result.selected.id, "chain-b");
  assert.equal(result.selected.runtime, "claude");
  const completed = await save(root, payload("chain-c", {
    taskStatus: "completed",
    sourceRuntime: "pi",
    destinationRuntime: "codex",
    supersedes: { id: "chain-b", digest: hash(await readFile(successor.file)) },
  }));
  assert.equal(completed.checkpoint.taskStatus, "completed");
  result = await discoverContexts(root);
  assert.equal(result.status, "NONE");
  assert.equal(result.candidates[0].id, "chain-c");
});

test("discovery requires an explicit task for multiple heads and never ranks by timestamp", async (t) => {
  const root = await project(t);
  await save(root, payload("task-one", { taskId: "one" }));
  await save(root, payload("task-two", { taskId: "two" }));
  for (const [id, timestamp] of [["task-one", "2099-01-01T00:00:00.000Z"], ["task-two", "2000-01-01T00:00:00.000Z"]]) {
    const file = path.join(root, `.olympus/context/${id}.json`);
    const checkpoint = JSON.parse(await readFile(file, "utf8"));
    checkpoint.createdAt = timestamp;
    await writeFile(file, `${JSON.stringify(checkpoint, null, 2)}\n`);
  }
  const ambiguous = await discoverContexts(root);
  assert.equal(ambiguous.status, "SELECTION_REQUIRED");
  assert.deepEqual(ambiguous.issues, ["multiple_unfinished_tasks_require_selector"]);
  const selected = await discoverContexts(root, { taskId: "two" });
  assert.equal(selected.status, "SELECTED");
  assert.equal(selected.selected.id, "task-two");
  assert.equal((await loadContext(root, "task-two")).status, "RECONCILIATION_REQUIRED");
});

test("forks, missing predecessors, wrong digests and malformed candidates require reconciliation", async (t) => {
  const root = await project(t);
  await save(root, payload("fork-root"));
  const predecessor = await readFile(path.join(root, ".olympus/context/fork-root.json"));
  const digest = hash(predecessor);
  await save(root, payload("fork-left", { supersedes: { id: "fork-root", digest } }));
  await save(root, payload("fork-right", { supersedes: { id: "fork-root", digest } }));
  const fork = await discoverContexts(root, { taskId: "task-continuity" });
  assert.equal(fork.status, "SELECTION_REQUIRED");
  assert.ok(fork.issues.includes("conflicting_successor_heads"));

  const other = await project(t);
  await save(other, payload("bad-link"));
  const badLinkFile = path.join(other, ".olympus/context/bad-link.json");
  const badLink = JSON.parse(await readFile(badLinkFile, "utf8"));
  badLink.supersedes = { id: "missing-parent", digest: `sha256:${"a".repeat(64)}` };
  await writeFile(badLinkFile, `${JSON.stringify(badLink, null, 2)}\n`);
  const missing = await discoverContexts(other);
  assert.equal(missing.status, "SELECTION_REQUIRED");
  assert.ok(missing.issues.some((issue) => issue.startsWith("predecessor_missing:")));
  const digestRoot = await project(t);
  await save(digestRoot, payload("digest-parent"));
  const child = await save(digestRoot, payload("digest-child", {
    supersedes: { id: "digest-parent", digest: hash(await readFile(path.join(digestRoot, ".olympus/context/digest-parent.json"))) },
  }));
  const parentFile = path.join(digestRoot, ".olympus/context/digest-parent.json");
  const alteredParent = JSON.parse(await readFile(parentFile, "utf8"));
  alteredParent.objective = "altered after successor was written";
  await writeFile(parentFile, `${JSON.stringify(alteredParent, null, 2)}\n`);
  const wrongDigest = await discoverContexts(digestRoot);
  assert.equal(wrongDigest.status, "SELECTION_REQUIRED");
  assert.ok(wrongDigest.issues.includes(`predecessor_mismatch:${child.checkpoint.id}`));
  assert.ok((await loadContext(digestRoot, child.checkpoint.id)).reasons.includes("checkpoint_lineage_incomplete_or_mismatched"));
  const cycleRoot = await project(t);
  await save(cycleRoot, payload("cycle-a"));
  await save(cycleRoot, payload("cycle-b"));
  for (const [id, parentId] of [["cycle-a", "cycle-b"], ["cycle-b", "cycle-a"]]) {
    const file = path.join(cycleRoot, `.olympus/context/${id}.json`);
    const checkpoint = JSON.parse(await readFile(file, "utf8"));
    checkpoint.supersedes = { id: parentId, digest: `sha256:${"0".repeat(64)}` };
    await writeFile(file, `${JSON.stringify(checkpoint, null, 2)}\n`);
  }
  const cycle = await discoverContexts(cycleRoot);
  assert.equal(cycle.status, "SELECTION_REQUIRED");
  assert.ok(cycle.issues.some((issue) => issue.startsWith("lineage_cycle:")));
  await writeFile(path.join(other, ".olympus/context/broken.json"), "{\"objective\":\"DO_NOT_ECHO\"");
  const malformedText = JSON.stringify(await discoverContexts(other));
  assert.match(malformedText, /checkpoint_invalid:broken/);
  assert.doesNotMatch(malformedText, /DO_NOT_ECHO/);
});

test("discovery rejects symlinks and never returns a partial selection after its scan limit", async (t) => {
  const root = await project(t);
  const saved = await save(root, payload("safe-head"));
  await symlink(saved.file, path.join(root, ".olympus/context/linked.json"));
  const symlinkResult = await discoverContexts(root);
  assert.equal(symlinkResult.status, "SELECTION_REQUIRED");
  assert.ok(symlinkResult.issues.includes("checkpoint_not_regular:linked"));

  const limited = await project(t);
  await save(limited, payload("would-have-been-selected"));
  for (let index = 0; index < 128; index += 1) {
    await writeFile(path.join(limited, `.olympus/context/extra-${String(index).padStart(3, "0")}.json`), "{}");
  }
  const result = await discoverContexts(limited);
  assert.equal(result.status, "SELECTION_REQUIRED");
  assert.deepEqual(result.issues, ["checkpoint_scan_file_limit_exceeded"]);
  assert.equal(Object.hasOwn(result, "selected"), false);
});

test("load reconciles changed references, work state, branch, age, and invalidates evidence", async (t) => {
  const root = await project(t);
  await mkdir(path.join(root, "knowledge"));
  await writeFile(path.join(root, "knowledge", "ref.md"), "evidence v1\n");
  const observed = await observeGit(root);
  const original = await save(root, payload("evidence-a", {
    artifacts: [{ path: "knowledge/ref.md", purpose: "review report" }],
    tests: [{ command: "node --test test/example.test.mjs", executedAt: new Date().toISOString(), outcome: "PASS", artifacts: ["knowledge/ref.md"], head: observed.head, workFingerprint: observed.workFingerprint }],
    reviews: [{ role: "Argus", verdict: "PASS", report: "knowledge/ref.md", base: observed.head, head: observed.head, workFingerprint: observed.workFingerprint }],
  }));
  assert.equal((await loadContext(root, "evidence-a")).status, "READY");
  const successor = await save(root, payload("evidence-b", {
    supersedes: { id: "evidence-a", digest: hash(await readFile(original.file)) },
  }));
  assert.deepEqual(successor.checkpoint.tests, original.checkpoint.tests);
  assert.deepEqual(successor.checkpoint.reviews, original.checkpoint.reviews);
  assert.equal((await loadContext(root, "evidence-b")).status, "READY");
  await writeFile(path.join(root, "knowledge", "ref.md"), "evidence v2\n");
  const changed = await loadContext(root, "evidence-b");
  assert.equal(changed.status, "RECONCILIATION_REQUIRED");
  assert.ok(changed.reasons.some((reason) => reason.startsWith("artifact_changed:")));
  assert.ok(changed.reasons.includes("work_fingerprint_mismatch"));
  assert.deepEqual(changed.historicalTests, [0]);
  assert.deepEqual(changed.invalidatedReviews, [0]);
  git(root, "checkout", "-qb", "other-branch");
  const branch = await loadContext(root, "evidence-a");
  assert.ok(branch.reasons.includes("branch_mismatch"));
  assert.equal((await discoverContexts(root)).status, "SELECTION_REQUIRED");
  const file = path.join(root, ".olympus/context/evidence-b.json");
  const checkpoint = JSON.parse(await readFile(file, "utf8"));
  checkpoint.createdAt = "2000-01-01T00:00:00.000Z";
  await writeFile(file, `${JSON.stringify(checkpoint, null, 2)}\n`);
  assert.ok((await loadContext(root, "evidence-b")).reasons.includes("checkpoint_expired"));
  checkpoint.createdAt = "2999-01-01T00:00:00.000Z";
  await writeFile(file, `${JSON.stringify(checkpoint, null, 2)}\n`);
  assert.ok((await loadContext(root, "evidence-b")).reasons.includes("checkpoint_timestamp_in_future"));

  const differentProject = await project(t, "independent project history\n");
  await mkdir(path.join(differentProject, ".olympus/context"), { recursive: true });
  const foreignCheckpoint = JSON.parse(await readFile(file, "utf8"));
  delete foreignCheckpoint.supersedes;
  foreignCheckpoint.id = "foreign-evidence";
  await writeFile(path.join(differentProject, ".olympus/context/foreign-evidence.json"), `${JSON.stringify(foreignCheckpoint)}\n`);
  assert.ok((await loadContext(differentProject, "foreign-evidence")).reasons.includes("project_identity_mismatch"));

  const revisionProject = await project(t);
  await save(revisionProject, payload("revision-a"));
  await writeFile(path.join(revisionProject, "app.txt"), "new committed source\n");
  git(revisionProject, "add", "app.txt");
  git(revisionProject, "commit", "-qm", "new revision");
  assert.ok((await loadContext(revisionProject, "revision-a")).reasons.includes("head_mismatch"));

  const stagedProject = await project(t);
  await save(stagedProject, payload("staged-a"));
  await writeFile(path.join(stagedProject, "app.txt"), "staged content\n");
  git(stagedProject, "add", "app.txt");
  assert.ok((await loadContext(stagedProject, "staged-a")).reasons.includes("work_fingerprint_mismatch"));
});

test("discovery NONE is read-only; schema failures are bounded; failed successor saves preserve checkpoints", async (t) => {
  const root = await project(t);
  const before = await readdir(root);
  assert.deepEqual(await discoverContexts(root), { status: "NONE", candidates: [], reason: "no_managed_context_directory" });
  assert.deepEqual(await readdir(root), before);
  const saved = await save(root, payload("schema-a"));
  const beforeFailure = await contextBytes(root);
  await assert.rejects(save(root, payload("schema-b", { supersedes: { id: "schema-a", digest: `sha256:${"0".repeat(64)}` } })), (error) => /digest mismatch/.test(error.message) && error.lastSuccessfulCheckpoint === undefined);
  await assert.rejects(save(root, payload("schema-c", {
    supersedes: { id: "schema-a", digest: hash(await readFile(path.join(root, ".olympus/context/schema-a.json"))) },
    artifacts: [{ path: "missing-report.md", purpose: "report" }],
  })), (error) => error.lastSuccessfulCheckpoint === "schema-a");
  assert.deepEqual(await contextBytes(root), beforeFailure);
  const checkpointFile = path.join(root, ".olympus/context/schema-a.json");
  const checkpoint = JSON.parse(await readFile(checkpointFile, "utf8"));
  checkpoint.schemaVersion = 99;
  await writeFile(checkpointFile, JSON.stringify(checkpoint));
  const invalid = await loadContext(root, "schema-a");
  assert.equal(invalid.status, "INVALID");
  assert.match(invalid.reasons[0], /Unsupported checkpoint schema version/);
  await assert.rejects(save(root, payload("../escape")));
  assert.equal(saved.checkpoint.id, "schema-a");
});

test("prune only deletes valid old checkpoint files and reports broken lineage", async (t) => {
  const root = await project(t);
  const first = await save(root, payload("prune-parent"));
  const firstFile = path.join(root, first.relative);
  const parent = JSON.parse(await readFile(firstFile, "utf8"));
  parent.createdAt = "2000-01-01T00:00:00.000Z";
  await writeFile(firstFile, `${JSON.stringify(parent, null, 2)}\n`);
  const successor = await save(root, payload("prune-child", { supersedes: { id: "prune-parent", digest: hash(await readFile(firstFile)) } }));
  await writeFile(path.join(root, ".olympus/context/not-json.json"), "invalid");
  const result = await pruneContexts(root, 1);
  assert.deepEqual(result.deleted, ["prune-parent"]);
  assert.deepEqual(result.lineageWarnings, [{ id: "prune-parent", successorCount: 1, reason: "pruned_checkpoint_is_a_lineage_predecessor" }]);
  assert.deepEqual(result.skipped, ["not-json.json", "prune-child.json"]);
  assert.equal((await readFile(successor.file, "utf8")).includes("prune-child"), true);
});

test("artifact provenance invalidates PASS reviews when any declared artifact changes or disappears", async (t) => {
  const root = await project(t);
  await writeFile(path.join(root, ".gitignore"), ".olympus/context/\nignored-report.md\nignored-input.md\n");
  git(root, "add", ".gitignore");
  git(root, "commit", "-qm", "ignore local evidence");
  await writeFile(path.join(root, "ignored-report.md"), "review report remains unchanged\n");
  await writeFile(path.join(root, "ignored-input.md"), "reviewed input version one\n");
  const reportBytes = await readFile(path.join(root, "ignored-report.md"));
  const observed = await observeGit(root);
  const first = await save(root, payload("artifact-history-a", {
    artifacts: [
      { path: "ignored-report.md", purpose: "review report" },
      { path: "ignored-input.md", purpose: "reviewed source input" },
    ],
    tests: [{ command: "node --test test/example.test.mjs", executedAt: new Date().toISOString(), outcome: "PASS", artifacts: ["ignored-report.md", "ignored-input.md"], head: observed.head, workFingerprint: observed.workFingerprint }],
    reviews: [{ role: "Argus", verdict: "PASS", report: "ignored-report.md", base: observed.head, head: observed.head, workFingerprint: observed.workFingerprint }],
  }));
  const originalDigests = new Map(first.checkpoint.artifacts.map((artifact) => [artifact.path, artifact.digest]));
  await writeFile(path.join(root, "ignored-input.md"), "reviewed input version two\n");
  assert.equal((await observeGit(root)).workFingerprint, observed.workFingerprint);

  const firstLoad = await loadContext(root, "artifact-history-a");
  assert.ok(firstLoad.reasons.includes("artifact_changed:ignored-input.md"));
  assert.ok(!firstLoad.reasons.includes("artifact_changed:ignored-report.md"));
  assert.deepEqual(await readFile(path.join(root, "ignored-report.md")), reportBytes);
  assert.deepEqual(firstLoad.historicalTests, [0]);
  assert.deepEqual(firstLoad.invalidatedReviews, [0]);

  const successor = await save(root, payload("artifact-history-b", {
    supersedes: { id: first.checkpoint.id, digest: hash(await readFile(first.file)) },
  }));
  assert.deepEqual(new Map(successor.checkpoint.artifacts.map((artifact) => [artifact.path, artifact.digest])), originalDigests);
  assert.deepEqual(successor.checkpoint.tests, first.checkpoint.tests);
  assert.deepEqual(successor.checkpoint.reviews, first.checkpoint.reviews);
  const successorLoad = await loadContext(root, "artifact-history-b");
  assert.ok(successorLoad.reasons.includes("artifact_changed:ignored-input.md"));
  assert.deepEqual(successorLoad.historicalTests, [0]);
  assert.deepEqual(successorLoad.invalidatedReviews, [0]);

  await rm(path.join(root, "ignored-input.md"));
  const missingLoad = await loadContext(root, "artifact-history-b");
  assert.ok(missingLoad.reasons.includes("artifact_missing_or_unavailable:ignored-input.md"));
  assert.deepEqual(missingLoad.invalidatedReviews, [0]);
});

test("discovery detects mixed-status forks before filtering completed leaves", async (t) => {
  for (const [taskStatus, idPrefix] of [["active", "active-completed"], ["paused", "paused-completed"]]) {
    const root = await project(t);
    const parent = await save(root, payload(`${idPrefix}-root`));
    const parentDigest = hash(await readFile(parent.file));
    await save(root, payload(`${idPrefix}-unfinished`, {
      taskStatus,
      supersedes: { id: parent.checkpoint.id, digest: parentDigest },
    }));
    await save(root, payload(`${idPrefix}-completed`, {
      taskStatus: "completed",
      supersedes: { id: parent.checkpoint.id, digest: parentDigest },
    }));

    const discovered = await discoverContexts(root, { taskId: "task-continuity" });
    assert.equal(discovered.status, "SELECTION_REQUIRED");
    assert.deepEqual(discovered.issues, ["conflicting_successor_heads"]);
    assert.equal(discovered.candidates.length, 2);
    assert.deepEqual(new Set(discovered.candidates.map((candidate) => candidate.taskStatus)), new Set([taskStatus, "completed"]));
  }
});

test("checkpoint reads stay bounded and reject non-regular files across load, predecessor, discovery, and prune", async (t) => {
  const oversized = await project(t);
  await save(oversized, payload("oversized-checkpoint"));
  const oversizedFile = path.join(oversized, ".olympus/context/oversized-checkpoint.json");
  await writeFile(oversizedFile, Buffer.alloc(64 * 1024 + 1, 0x20));
  assert.equal((await loadContext(oversized, "oversized-checkpoint")).status, "INVALID");
  await assert.rejects(save(oversized, payload("oversized-successor", {
    supersedes: { id: "oversized-checkpoint", digest: hash(await readFile(oversizedFile)) },
  })), /byte limit|bounded regular file/);
  const discoveredOversize = await discoverContexts(oversized);
  assert.equal(discoveredOversize.status, "SELECTION_REQUIRED");
  assert.deepEqual(discoveredOversize.issues, ["checkpoint_scan_byte_limit_exceeded"]);
  assert.deepEqual((await pruneContexts(oversized, 0)).skipped, ["oversized-checkpoint.json"]);

  const nonRegular = await project(t);
  await mkdir(path.join(nonRegular, ".olympus/context/not-a-file.json"), { recursive: true });
  const discovery = await discoverContexts(nonRegular);
  assert.equal(discovery.status, "SELECTION_REQUIRED");
  assert.ok(discovery.issues.includes("checkpoint_not_regular:not-a-file"));
  assert.equal((await loadContext(nonRegular, "not-a-file")).status, "INVALID");
  assert.deepEqual((await pruneContexts(nonRegular, 0)).skipped, ["not-a-file.json"]);
});

test("credential screening blocks escaped checkpoint input and stored data without echoing values", async (t) => {
  const root = await project(t);
  const synthetic = "github_pat_AUDIT_FAKE_TOKEN_1234567890";
  const escapedInput = JSON.stringify(payload("safe-input", { objective: synthetic }))
    .replace("github_pat_AUDIT", String.raw`github_pat\u005fAUDIT`);
  await assert.rejects(saveContext(root, Buffer.from(escapedInput)), (error) => !error.message.includes(synthetic));

  const saved = await save(root, payload("safe-stored"));
  const stored = JSON.parse(await readFile(saved.file, "utf8"));
  stored.objective = synthetic;
  await writeFile(saved.file, JSON.stringify(stored));
  await assert.rejects(inspectContext(root, "safe-stored"), (error) => !error.message.includes(synthetic));
  const loaded = await loadContext(root, "safe-stored");
  assert.equal(loaded.status, "INVALID");
  assert.doesNotMatch(JSON.stringify(loaded), /AUDIT_FAKE_TOKEN_1234567890/);

  await writeFile(path.join(root, "artifact-fixture.txt"), "Authorization: Bearer AUDIT_FAKE_TOKEN_1234567890");
  await assert.rejects(save(root, payload("safe-artifact", {
    artifacts: [{ path: "artifact-fixture.txt", purpose: "synthetic negative fixture" }],
  })), (error) => !error.message.includes("AUDIT_FAKE_TOKEN_1234567890"));
});

