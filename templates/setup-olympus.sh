#!/usr/bin/env bash
# Bootstrap Olympus on macOS/Linux. Run from a checkout or pass --source <npm-spec>.
# Options: --project DIR, --source PATH|NPM_SPEC, --skip-runtimes, --login.
set -euo pipefail

PROJECT=""; SOURCE="${OLYMPUS_SOURCE:-}"; SKIP_RUNTIMES=0; LOGIN=0
while [ $# -gt 0 ]; do
  case "$1" in
    --project) [ "$#" -ge 2 ] || { echo "--project requires a directory" >&2; exit 2; }; PROJECT="$2"; shift 2 ;;
    --source) [ "$#" -ge 2 ] || { echo "--source requires a path or package spec" >&2; exit 2; }; SOURCE="$2"; shift 2 ;;
    --skip-runtimes) SKIP_RUNTIMES=1; shift ;;
    --login) LOGIN=1; shift ;;
    -h|--help) sed -n '2,3p' "$0"; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; exit 2 ;;
  esac
done

have() { command -v "$1" >/dev/null 2>&1; }
step() { printf '\n==> %s\n' "$1"; }
warn() { printf '    warn %s\n' "$1"; }
SUDO=""; [ "$(id -u)" -eq 0 ] || { have sudo && SUDO=sudo; }
pkg_install() {
  if have brew; then brew install "$1"
  elif have apt-get; then $SUDO apt-get update -qq && $SUDO apt-get install -y -qq "$2"
  elif have dnf; then $SUDO dnf install -y "$3"
  else echo "Install $4 manually, then rerun." >&2; exit 1; fi
}
install_node() {
  if have brew; then brew install node
  elif have apt-get; then
    if [ "$(id -u)" -eq 0 ]; then curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    else curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -; fi
    $SUDO apt-get install -y -qq nodejs
  elif have dnf; then curl -fsSL https://rpm.nodesource.com/setup_22.x | $SUDO bash - && $SUDO dnf install -y nodejs
  else echo "Install Node.js >= 18 manually, then rerun." >&2; exit 1; fi
}

export PATH="$HOME/.local/bin:$HOME/.npm-global/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
step "Checking required tools"
have git || pkg_install git git git "git"
have curl || pkg_install curl curl curl "curl"
NODE_MAJOR=0; have node && NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 18 ] || install_node
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 18 ] || { echo "Node.js >= 18 is required." >&2; exit 1; }
have python3 || pkg_install python python3 python3 "Python 3"

if [ "$SKIP_RUNTIMES" -eq 0 ]; then
  step "Claude Code"
  if ! have claude; then
    if curl -fsSL https://claude.ai/install.sh | bash; then :; else warn "Native installer failed; trying npm."; npm install -g @anthropic-ai/claude-code; fi
    hash -r
  fi
  step "Codex CLI"
  if ! have codex; then npm install -g @openai/codex; hash -r; fi
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
if [ -z "$SOURCE" ] && [ -f "$REPO_DIR/bin/olympus.mjs" ]; then SOURCE="$REPO_DIR"; fi
if [ -z "$SOURCE" ]; then
  echo "No local checkout found. Pass --source <path|npm-package-spec> or set OLYMPUS_SOURCE." >&2
  exit 2
fi
olympus() {
  if [ -d "$SOURCE" ]; then node "$SOURCE/bin/olympus.mjs" "$@"
  else npx --yes "$SOURCE" "$@"; fi
}

step "Installing Olympus user resources"
olympus install --scope user --upgrade
if [ -n "$PROJECT" ]; then
  [ -d "$PROJECT" ] || { echo "Project directory does not exist: $PROJECT" >&2; exit 1; }
  step "Installing Olympus project resources"
  olympus install --target "$PROJECT" --upgrade
fi

if [ "$LOGIN" -eq 1 ]; then
  have codex && codex login || true
  have claude && claude || true
fi
printf '\nOlympus setup complete. Open a new shell if a runtime was just installed.\n'
