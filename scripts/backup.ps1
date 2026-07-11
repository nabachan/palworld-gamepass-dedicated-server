#Requires -Version 5.1
<#
.SYNOPSIS
  Timestamped backup of Pal\Saved (world saves + runtime config).
#>

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\..\config\server-config.ps1"

if (-not (Test-Path $SavedDir)) {
    Write-Host "Saved folder not found: $SavedDir" -ForegroundColor Red
    Write-Host "Has the server been started at least once?" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path $BackupsDir)) {
    New-Item -ItemType Directory -Path $BackupsDir -Force | Out-Null
}

$stamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$dest = Join-Path $BackupsDir $stamp

Write-Host "Backup Pal\Saved -> $dest" -ForegroundColor Cyan
Write-PalLog "Backup started -> $dest"

New-Item -ItemType Directory -Path $dest -Force | Out-Null
& robocopy $SavedDir $dest /E /R:2 /W:3 /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) {
    Write-PalLog "Robocopy failed (code $LASTEXITCODE)" "ERROR"
    exit 1
}

@"
timestamp=$stamp
source=$SavedDir
"@ | Set-Content -Path (Join-Path $dest "backup_info.txt") -Encoding UTF8

Write-Host "Backup OK." -ForegroundColor Green
Write-PalLog "Backup OK: $dest"

$all = Get-ChildItem -Path $BackupsDir -Directory | Sort-Object Name -Descending
if ($all.Count -gt $BackupKeepCount) {
    foreach ($old in ($all | Select-Object -Skip $BackupKeepCount)) {
        Write-PalLog "Removing old backup: $($old.FullName)"
        Remove-Item -Path $old.FullName -Recurse -Force
    }
}

Write-Host "Keeping up to $BackupKeepCount backups."
