#Requires -Version 5.1
<#
.SYNOPSIS
  Update the dedicated server via SteamCMD (app_update 2394010).
#>

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\..\config\server-config.ps1"

Write-Host "=== Update Palworld Dedicated Server ===" -ForegroundColor Cyan

$running = Get-Process -ErrorAction SilentlyContinue |
    Where-Object { $ProcessNameHints -contains $_.ProcessName }
if ($running) {
    Write-Host "Server is still running. Stop it first:" -ForegroundColor Red
    Write-Host "  .\backup.ps1"
    Write-Host "  .\stop_server.ps1"
    exit 1
}

$steamCmdExe = Join-Path $SteamCmdDir "steamcmd.exe"
if (-not (Test-Path $steamCmdExe)) {
    Write-Host "SteamCMD missing. Run install_server.ps1" -ForegroundColor Red
    exit 1
}

if (Test-Path $SavedDir) {
    Write-Host "Automatic backup before update..." -ForegroundColor Yellow
    & "$PSScriptRoot\backup.ps1"
}

Write-Host "SteamCMD +app_update $AppId validate..." -ForegroundColor Yellow
$code = Invoke-SteamCmd -Commands @("app_update $AppId validate")
if ($code -ne 0 -and $code -ne 7) {
    Write-PalLog "SteamCMD exit code = $code" "WARN"
}

if (-not (Test-Path $ServerExe)) {
    Write-Host "ERROR: PalServer.exe still missing." -ForegroundColor Red
    exit 1
}

Ensure-PalWorldSettings
if (-not (Test-Path $WindowsConfig)) {
    New-Item -ItemType Directory -Path $WindowsConfig -Force | Out-Null
}
Copy-Item -Path $SettingsSource -Destination $SettingsTarget -Force

Write-PalLog "Update finished."
Write-Host "Update OK. Start with start_server.ps1 or auto_restart.ps1" -ForegroundColor Green
