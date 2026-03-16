$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSCommandPath
$index = Join-Path $root "index.html"
$refresh = Join-Path $root "scripts\\refresh_manifest.ps1"

if (-not (Test-Path $index)) {
  throw "Missing: $index"
}

if (Test-Path $refresh) {
  powershell -NoProfile -ExecutionPolicy Bypass -File $refresh | Out-Null
}

Start-Process $index
