<#
.SYNOPSIS
  Bootstrap Olympus on Windows. Run from a checkout or pass -Source <path|package-spec>.
.PARAMETER Project
  Also update the packaged resources in an existing project directory.
.PARAMETER Source
  Local checkout path or npm package spec. No package identity is assumed.
.PARAMETER SkipRuntimes
  Do not install Claude Code or Codex CLI.
.PARAMETER Login
  Start interactive Codex and Claude sign-in after setup.
#>
[CmdletBinding()]
param(
  [string]$Project,
  [string]$Source = $env:OLYMPUS_SOURCE,
  [switch]$SkipRuntimes,
  [switch]$Login
)
$ErrorActionPreference = "Stop"

function Have($Name) { return [bool](Get-Command $Name -ErrorAction SilentlyContinue) }
function Step($Message) { Write-Host "`n==> $Message" -ForegroundColor Cyan }
function Warn($Message) { Write-Host "    warn $Message" -ForegroundColor Yellow }
function RefreshPath {
  $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
}
function WingetInstall($Id, $Label) {
  if (-not (Have "winget")) { throw "winget is unavailable; install $Label manually and rerun." }
  Step "Installing $Label"
  winget install --id $Id -e --accept-source-agreements --accept-package-agreements --silent | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "winget failed to install $Label (exit $LASTEXITCODE)." }
  RefreshPath
}

Step "Checking required tools"
if (-not (Have "git")) { WingetInstall "Git.Git" "Git for Windows" }
$nodeMajor = 0
if (Have "node") { $nodeMajor = [int](node -p "process.versions.node.split('.')[0]") }
if ($nodeMajor -lt 18) { WingetInstall "OpenJS.NodeJS.LTS" "Node.js LTS" }
$nodeMajor = [int](node -p "process.versions.node.split('.')[0]")
if ($nodeMajor -lt 18) { throw "Node.js >= 18 is required; open a new terminal and rerun." }
if (-not (Have "python") -and -not (Have "python3")) { WingetInstall "Python.Python.3.12" "Python 3" }

if (-not $SkipRuntimes) {
  Step "Claude Code"
  if (-not (Have "claude")) {
    try { Invoke-RestMethod -Uri "https://claude.ai/install.ps1" | Invoke-Expression; RefreshPath }
    catch { Warn "Native installer failed; trying npm."; npm install -g @anthropic-ai/claude-code; RefreshPath }
  }
  Step "Codex CLI"
  if (-not (Have "codex")) { npm install -g @openai/codex; RefreshPath }
}

if (-not $Source) {
  $repoDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
  if (Test-Path (Join-Path $repoDir "bin\olympus.mjs")) { $Source = $repoDir }
}
if (-not $Source) { throw "No local checkout found. Pass -Source <path|npm-package-spec> or set OLYMPUS_SOURCE." }
function Invoke-Olympus([string[]]$OlympusArgs) {
  if (Test-Path $Source -PathType Container) {
    & node (Join-Path (Resolve-Path $Source) "bin\olympus.mjs") @OlympusArgs
  } else {
    & npx --yes $Source @OlympusArgs
  }
  if ($LASTEXITCODE -ne 0) { throw "Olympus command failed (exit $LASTEXITCODE)." }
}

Step "Installing Olympus user resources"
Invoke-Olympus -OlympusArgs @("install", "--scope", "user", "--upgrade")
if ($Project) {
  if (-not (Test-Path $Project -PathType Container)) { throw "Project directory does not exist: $Project" }
  Step "Installing Olympus project resources"
  Invoke-Olympus -OlympusArgs @("install", "--target", $Project, "--upgrade")
}

if ($Login) {
  if (Have "codex") { codex login }
  if (Have "claude") { claude }
}
Write-Host "`nOlympus setup complete. Open a new terminal if a runtime was just installed."
