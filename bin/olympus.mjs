#!/usr/bin/env node
import { install } from "../src/installer.mjs";

const args = process.argv.slice(2);
if (args[0] !== "install") {
  console.error("Usage: olympus install --target <project-directory>");
  process.exit(2);
}

let target;
for (let i = 1; i < args.length; i += 1) {
  if (args[i] === "--target") target = args[++i];
  else {
    console.error(`Unknown argument: ${args[i]}`);
    process.exit(2);
  }
}
if (!target) {
  console.error("An explicit --target directory is required.");
  process.exit(2);
}

try {
  const result = await install({ target });
  for (const path of result.installed) console.log(`Installed ${path}`);
  for (const path of result.identical) console.log(`Preserved identical ${path}`);
} catch (error) {
  console.error(`Olympus install failed: ${error.message}`);
  process.exit(1);
}
