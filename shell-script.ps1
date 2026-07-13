#Requires -Version 5.1
# New Windows Terminal window: 2×2 split — frontend / backend / shared / editor.
# macOS equivalent: shell-script.sh (iTerm + AppleScript)

$ErrorActionPreference = 'Stop'

$Root = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($Root)) {
  $Root = (Get-Location).Path
}

$FrontendEnv = Join-Path $Root 'apps\frontend\.env.local'
$FrontendPort = '4000'
if (Test-Path -LiteralPath $FrontendEnv) {
  $portLine = Get-Content -LiteralPath $FrontendEnv |
    Where-Object { $_ -match '^\s*PORT\s*=' } |
    Select-Object -Last 1
  if ($portLine) {
    $FrontendPort = ($portLine -replace '^\s*PORT\s*=\s*', '' -replace '[\"'']', '').Trim()
  }
}

if (-not (Get-Command wt -ErrorAction SilentlyContinue)) {
  Write-Error "Windows Terminal ('wt') not found in PATH. Install it from the Microsoft Store, then retry."
}

$sharedDir = Join-Path $Root 'packages\shared'
$frontendDir = Join-Path $Root 'apps\frontend'
$backendDir = Join-Path $Root 'apps\backend'

if (Get-Command cursor -ErrorAction SilentlyContinue) {
  $editorCmd = 'cursor .'
}
elseif (Get-Command code -ErrorAction SilentlyContinue) {
  $editorCmd = 'code .'
}
else {
  $editorCmd = 'echo Neither cursor nor code found in PATH'
}

# Layout (matches shell-script.sh / iTerm):
#   [ frontend ] [ shared ]
#   [ backend  ] [ editor ]
#
# Use cmd /k so wt argument quoting stays simple (no PowerShell -Command braces).
# Pass --port explicitly — package.json cannot use bash ${PORT:-4000} on Windows.

& wt @(
  '-w', '0'
  'new-tab', '--title', 'Constellation', '-d', $frontendDir
  'cmd', '/k', "pnpm exec next dev --port $FrontendPort"
  ';'
  'split-pane', '-V', '-d', $sharedDir
  'cmd', '/k', 'pnpm dev'
  ';'
  'move-focus', 'left'
  ';'
  'split-pane', '-H', '-d', $backendDir
  'cmd', '/k', 'pnpm dev'
  ';'
  'move-focus', 'right'
  ';'
  'split-pane', '-H', '-d', $Root
  'cmd', '/k', $editorCmd
)
