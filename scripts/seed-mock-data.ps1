$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)
pnpm db:seed
Write-Host "mock seeded."