import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cases = JSON.parse(await readFile(path.join(root, "test/fixtures/hades-candidates.json"), "utf8"));
const skill = await readFile(path.join(root, ".agents/skills/hades/SKILL.md"), "utf8");

test("Hades offline fixtures cover positive, ordinary, dynamic, convention, external and duplicate evidence", () => {
  const byId = new Map(cases.map((candidate) => [candidate.id, candidate]));
  for (const id of ["dead-internal-helper", "ordinary-import", "dynamic-loader", "framework-convention", "external-consumer", "duplicate-with-migration", "absence-only"]) {
    assert.ok(byId.has(id), `missing fixture ${id}`);
  }
  assert.equal(byId.get("ordinary-import").recommendation, "KEEP");
  assert.equal(byId.get("framework-convention").recommendation, "KEEP");
  assert.equal(byId.get("dynamic-loader").recommendation, "NEEDS_INVESTIGATION");
  assert.equal(byId.get("external-consumer").recommendation, "NEEDS_INVESTIGATION");
  assert.equal(byId.get("absence-only").recommendation, "NEEDS_INVESTIGATION");
  assert.equal(byId.get("dead-internal-helper").recommendation, "REMOVAL_CANDIDATE");
  assert.equal(byId.get("duplicate-with-migration").recommendation, "REMOVAL_CANDIDATE");
});

test("absence of static references alone never passes the Hades removal oracle", () => {
  const candidate = cases.find((item) => item.id === "absence-only");
  assert.deepEqual(candidate.observed, ["static search returned no references"]);
  assert.ok(candidate.missing.length >= 3);
  assert.equal(candidate.recommendation, "NEEDS_INVESTIGATION");
  assert.match(skill, /Never recommend safe removal solely because static search found no references/);
});

test("Hades contract is read-only and separates BURY and EXHUME authority", () => {
  assert.match(skill, /read-only/i);
  assert.match(skill, /do not edit or remove application code/i);
  assert.match(skill, /Argus independently reviews/);
  assert.match(skill, /does not create the export or apply it to application paths/i);
  assert.match(skill, /NEEDS_INVESTIGATION/);
  assert.match(skill, /INSUFFICIENT_EVIDENCE/);
  assert.match(skill, /Do not inspect `.env` files, credentials, private keys/);
});
