#Requires -Version 5.1
# New Windows Terminal window: 2×2 split — frontend / backend / shared / filter-ai.
# Opens Cursor/VS Code separately. macOS equivalent: shell-script.sh

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

$wt = Get-Command wt -ErrorAction SilentlyContinue
if (-not $wt) {
  Write-Error "Windows Terminal ('wt') not found in PATH. Install it from the Microsoft Store, then retry."
}

$sharedDir = Join-Path $Root 'packages\shared'
$frontendDir = Join-Path $Root 'apps\frontend'
$backendDir = Join-Path $Root 'apps\backend'
$filterAiDir = Join-Path $Root 'apps\filter-ai'

foreach ($dir in @($sharedDir, $frontendDir, $backendDir, $filterAiDir)) {
  if (-not (Test-Path -LiteralPath $dir)) {
    Write-Error "Missing directory: $dir"
  }
}

# Layout:
#   [ frontend ] [ shared    ]
#   [ backend  ] [ filter-ai ]
#
# Build one wt argument string (reliably parsed by Windows Terminal).
# Avoid Start-Process failures aborting before wt (editor is best-effort).

$argList = @(
  "new-tab --title `"Constellation`" -d `"$frontendDir`" cmd /k `"pnpm exec next dev --port $FrontendPort`""
  "split-pane -V -d `"$sharedDir`" cmd /k `"pnpm dev`""
  "move-focus left"
  "split-pane -H -d `"$backendDir`" cmd /k `"pnpm dev`""
  "move-focus right"
  "split-pane -H -d `"$filterAiDir`" cmd /k `"pnpm dev`""
) -join ' ; '

Start-Process -FilePath $wt.Source -ArgumentList $argList

try {
  if (Get-Command cursor -ErrorAction SilentlyContinue) {
    Start-Process -FilePath (Get-Command cursor).Source -ArgumentList "`"$Root`"" -ErrorAction SilentlyContinue | Out-Null
  }
  elseif (Get-Command code -ErrorAction SilentlyContinue) {
    Start-Process -FilePath (Get-Command code).Source -ArgumentList "`"$Root`"" -ErrorAction SilentlyContinue | Out-Null
  }
}
catch {
  # Editor is optional — never block the dev panes.
}
