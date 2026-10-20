import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { install } from "../src/installer.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(root, "bin/olympus.mjs");

function run(args) {
  return spawnSync(process.execPath, [cli, ...args], { cwd: root, encoding: "utf8", timeout: 15_000 });
}

async function temporaryDirectory() {
  return mkdtemp(path.join(os.tmpdir(), "olympus-st04-"));
}

test("project installation includes Hermes/Hades while preserving protected AGENTS.md and excluding transient state", async (t) => {
  const target = await temporaryDirectory();
  t.after(() => rm(target, { recursive: true, force: true }));
  const agents = "project-owned instructions\n";
  await writeFile(path.join(target, "AGENTS.md"), agents);
  const result = run(["install", "--target", target]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(await readFile(path.join(target, "AGENTS.md"), "utf8"), agents);
  assert.match(await readFile(path.join(target, ".agents/skills/hermes/SKILL.md"), "utf8"), /Hermes/);
  assert.match(await readFile(path.join(target, ".agents/skills/hades/SKILL.md"), "utf8"), /read-only/i);
  await assert.rejects(readFile(path.join(target, ".olympus/context")));
  await assert.rejects(readFile(path.join(target, "knowledge/graveyard")));
  const check = run(["check", "--target", target]);
  assert.equal(check.status, 0, check.stderr);
});

test("user-scope install/update preserve fake-home AGENTS.md and custom settings; upgrade rejects local profile edits", async (t) => {
  const home = await temporaryDirectory();
  t.after(() => rm(home, { recursive: true, force: true }));
  const agents = "custom home instructions\n";
  const settings = JSON.stringify({ custom: true, hooks: { retained: true } }, null, 2) + "\n";
  await writeFile(path.join(home, "AGENTS.md"), agents);
  await mkdir(path.join(home, ".claude"), { recursive: true });
  await writeFile(path.join(home, ".claude/settings.json"), settings);

  const install = run(["install", "--scope", "user", "--home", home]);
  assert.equal(install.status, 0, install.stderr);
  assert.match(await readFile(path.join(home, ".agents/agents/hades.md"), "utf8"), /openai\/gpt-6-astra/);
  assert.match(await readFile(path.join(home, ".claude/agents/hades.md"), "utf8"), /~\/.agents\/skills\/hades\/SKILL\.md/);
  assert.match(await readFile(path.join(home, ".codex/agents/hades.toml"), "utf8"), /~\/.agents\/skills\/hades\/SKILL\.md/);
  assert.equal(await readFile(path.join(home, "AGENTS.md"), "utf8"), agents);
  assert.equal(await readFile(path.join(home, ".claude/settings.json"), "utf8"), settings);

  const managed = path.join(home, ".agents/agents/hades.md");
  const local = `${await readFile(managed, "utf8")}\nlocal customization\n`;
  await writeFile(managed, local);
  const upgrade = run(["install", "--scope", "user", "--home", home, "--upgrade"]);
  assert.notEqual(upgrade.status, 0);
  assert.equal(await readFile(managed, "utf8"), local);

  const update = run(["install", "--scope", "user", "--home", home, "--update"]);
  assert.equal(update.status, 0, update.stderr);
  assert.ok(!(await readFile(managed, "utf8")).includes("local customization"));
  assert.equal(await readFile(path.join(home, "AGENTS.md"), "utf8"), agents);
  assert.equal(await readFile(path.join(home, ".claude/settings.json"), "utf8"), settings);
  const check = run(["check", "--scope", "user", "--home", home]);
  assert.equal(check.status, 0, check.stderr);
});

test("user-scope install provides the explicitly selected Claude Zeus profile without creating global startup instructions", async (t) => {
  const home = await temporaryDirectory();
  t.after(() => rm(home, { recursive: true, force: true }));

  const install = run(["install", "--scope", "user", "--home", home]);
  assert.equal(install.status, 0, install.stderr);

  const claudeZeus = await readFile(path.join(home, ".claude/agents/zeus.md"), "utf8");
  assert.match(claudeZeus, /first actionable turn/);
  assert.match(claudeZeus, /~\/\.agents\/skills\/hermes\/SKILL\.md/);

  // User scope installs profiles and skills, but deliberately leaves each
  // runtime's global instruction entry point under the user's control.
  await assert.rejects(readFile(path.join(home, ".codex/AGENTS.md")));
  await assert.rejects(readFile(path.join(home, ".pi/agent/AGENTS.md")));
  await assert.rejects(readFile(path.join(home, ".claude/CLAUDE.md")));
  await assert.rejects(readFile(path.join(home, "AGENTS.md")));
});

test("default project install rejects custom settings conflict without partial Hades install", async (t) => {
  const target = await temporaryDirectory();
  t.after(() => rm(target, { recursive: true, force: true }));
  const settings = JSON.stringify({ agent: "project-custom", permissions: { deny: ["Bash"] } }, null, 2) + "\n";
  await mkdir(path.join(target, ".claude"), { recursive: true });
  await writeFile(path.join(target, ".claude/settings.json"), settings);
  await assert.rejects(install({ target }), /Conflicting managed files/);
  assert.equal(await readFile(path.join(target, ".claude/settings.json"), "utf8"), settings);
  await assert.rejects(readFile(path.join(target, ".agents/skills/hades/SKILL.md")));
});
