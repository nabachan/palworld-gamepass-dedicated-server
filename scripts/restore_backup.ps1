#Requires -Version 5.1
<#
.SYNOPSIS
  Restore a timestamped backup into Pal\Saved.
#>

param(
    [string]$BackupName
)

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\..\config\server-config.ps1"

$running = Get-Process -ErrorAction SilentlyContinue |
    Where-Object { $ProcessNameHints -contains $_.ProcessName }
if ($running) {
    Write-Host "Stop the server first: .\stop_server.ps1" -ForegroundColor Red
    exit 1
}

$backups = Get-ChildItem -Path $BackupsDir -Directory -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending
if (-not $backups) {
    Write-Host "No backups in $BackupsDir" -ForegroundColor Red
    exit 1
}

if (-not $BackupName) {
    Write-Host "Available backups:" -ForegroundColor Cyan
    $backups | ForEach-Object { Write-Host "  $($_.Name)" }
    $BackupName = $backups[0].Name
    Write-Host ""
    Write-Host "No selection: using newest -> $BackupName" -ForegroundColor Yellow
}

$src = Join-Path $BackupsDir $BackupName
if (-not (Test-Path $src)) {
    Write-Host "Backup not found: $src" -ForegroundColor Red
    exit 1
}

Write-Host "WARNING: this replaces $SavedDir" -ForegroundColor Red
Write-Host "Source: $src"
$confirm = Read-Host "Type YES to confirm"
if ($confirm -ne "YES") {
    Write-Host "Cancelled."
    exit 0
}

Write-Host "Safety snapshot of current state..." -ForegroundColor Yellow
& "$PSScriptRoot\backup.ps1"

if (-not (Test-Path $SavedDir)) {
    New-Item -ItemType Directory -Path $SavedDir -Force | Out-Null
}
Get-ChildItem -Path $SavedDir -Force | Remove-Item -Recurse -Force
Copy-Item -Path (Join-Path $src "*") -Destination $SavedDir -Recurse -Force

Write-PalLog "Restored from $BackupName"
Write-Host "Restore OK. Start the server again." -ForegroundColor Green
