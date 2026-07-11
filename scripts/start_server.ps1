#Requires -Version 5.1
<#
.SYNOPSIS
  Start the Palworld dedicated server with crossplay-friendly launch args.
#>

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\..\config\server-config.ps1"

if (-not (Test-Path $ServerExe)) {
    Write-Host "PalServer.exe not found. Run .\install_server.ps1 first." -ForegroundColor Red
    exit 1
}

Ensure-PalWorldSettings
if (-not (Test-Path $WindowsConfig)) {
    New-Item -ItemType Directory -Path $WindowsConfig -Force | Out-Null
}
Copy-Item -Path $SettingsSource -Destination $SettingsTarget -Force
Write-PalLog "Config deployed -> $SettingsTarget"

$argLine = $LaunchArgs -join " "
Write-PalLog "Starting: $ServerExe $argLine"
Write-Host ""
Write-Host "Starting Palworld dedicated server..." -ForegroundColor Cyan
Write-Host "  Ports : UDP $GamePort (game) | UDP/TCP $QueryPort (query)"
Write-Host "  Crossplay: Steam + Xbox/Game Pass (-publiclobby)"
Write-Host "  Stop with: .\stop_server.ps1"
Write-Host ""

Set-Location $ServerDir
$p = Start-Process -FilePath $ServerExe -ArgumentList $LaunchArgs -WorkingDirectory $ServerDir -PassThru
Write-PalLog "PID = $($p.Id)"
Write-Host "Server PID: $($p.Id)" -ForegroundColor Green
Wait-Process -Id $p.Id
Write-PalLog "Process exited."
