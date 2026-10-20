#!/usr/bin/env bash
# Install only Olympus user-scope agents, skills and hooks.
# Usage: bash bootstrap-user.sh <local-checkout|npm-package-spec>
set -euo pipefail
SOURCE="${1:-${OLYMPUS_SOURCE:-}}"
if [ -z "$SOURCE" ]; then
  echo "Pass the Olympus checkout path or package spec (or set OLYMPUS_SOURCE)." >&2
  exit 2
fi
if [ -d "$SOURCE" ]; then
  node "$SOURCE/bin/olympus.mjs" install --scope user --upgrade
else
  npx --yes "$SOURCE" install --scope user --upgrade
fi
echo "Olympus user-scope installation complete."
