# Convenience wrapper for the one-time full historical backfill (2019 -> present).
# Run from the repo root. Requires backend/.venv already created and NVD_API_KEY
# available via ../.env or the environment.
#
# Usage: pwsh scripts/build_initial_db.ps1

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $repoRoot "backend"

Push-Location $backend
try {
    & ".\.venv\Scripts\python.exe" -m ingestion.backfill
    & ".\.venv\Scripts\python.exe" -m ingestion.forecasting
}
finally {
    Pop-Location
}
