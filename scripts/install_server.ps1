#Requires -Version 5.1
<#
.SYNOPSIS
  Install SteamCMD and the Palworld Dedicated Server (AppID 2394010).
#>

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\..\config\server-config.ps1"

Write-Host ""
Write-Host "=== Palworld Dedicated Server install ===" -ForegroundColor Cyan
Write-Host "Repo root   : $RepoRoot"
Write-Host "Install root: $PalRoot"
Write-Host "SteamCMD    : $SteamCmdDir"
Write-Host "Server      : $ServerDir"
Write-Host "AppID       : $AppId"
Write-Host ""

Write-Host "[1/5] Creating folders..." -ForegroundColor Yellow
foreach ($d in @($PalRoot, $SteamCmdDir, $ServerDir, $BackupsDir, $LogsDir, $WindowsConfig)) {
    if (-not (Test-Path $d)) {
        New-Item -ItemType Directory -Path $d -Force | Out-Null
        Write-Host "  + $d"
    }
}

Ensure-PalWorldSettings

$steamCmdExe = Join-Path $SteamCmdDir "steamcmd.exe"
if (-not (Test-Path $steamCmdExe)) {
    Write-Host "[2/5] Downloading SteamCMD..." -ForegroundColor Yellow
    $zipPath = Join-Path $env:TEMP "steamcmd.zip"
    $url = "https://steamcdn-a.akamaihd.net/client/installer/steamcmd.zip"
    Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing
    Expand-Archive -Path $zipPath -DestinationPath $SteamCmdDir -Force
    Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
    Write-Host "  SteamCMD extracted."
} else {
    Write-Host "[2/5] SteamCMD already present." -ForegroundColor Green
}

Write-Host "  Bootstrapping SteamCMD (+quit)..." -ForegroundColor DarkYellow
$prevEa = $ErrorActionPreference
$ErrorActionPreference = "Continue"
Push-Location $SteamCmdDir
try { & $steamCmdExe +quit | Out-Null } finally {
    Pop-Location
    $ErrorActionPreference = $prevEa
}

Write-Host "[3/5] Installing / updating Palworld Dedicated Server..." -ForegroundColor Yellow
Write-Host "  This may take several minutes (multi-GB download)."
$code = Invoke-SteamCmd -Commands @("app_update $AppId validate")
if ($code -ne 0 -and $code -ne 7) {
    Write-PalLog "SteamCMD exit code = $code" "WARN"
}
Start-Sleep -Seconds 2

if (-not (Test-Path $ServerExe)) {
    Write-Host "  Fallback: quoted SteamCMD invocation..." -ForegroundColor Yellow
    $installDir = ($ServerDir -replace '\\', '/')
    Push-Location $SteamCmdDir
    try {
        & $steamCmdExe `
            "+force_install_dir $installDir" `
            "+login anonymous" `
            "+app_update $AppId validate" `
            "+quit"
    } finally { Pop-Location }
    Start-Sleep -Seconds 2
}

if (-not (Test-Path $ServerExe)) {
    Write-Host "ERROR: PalServer.exe not found after install." -ForegroundColor Red
    Write-Host "Check: $ServerDir" -ForegroundColor Red
    exit 1
}
Write-Host "  PalServer.exe OK." -ForegroundColor Green

Write-Host "[4/5] Deploying PalWorldSettings.ini..." -ForegroundColor Yellow
if (-not (Test-Path $WindowsConfig)) {
    New-Item -ItemType Directory -Path $WindowsConfig -Force | Out-Null
}
Copy-Item -Path $SettingsSource -Destination $SettingsTarget -Force
Write-Host "  Copied -> $SettingsTarget" -ForegroundColor Green

Write-Host "[5/5] Done." -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "  1. Edit config\PalWorldSettings.ini (change AdminPassword)"
Write-Host "  2. Admin PowerShell: .\setup_firewall.ps1"
Write-Host "  3. Port-forward UDP 8211 + UDP/TCP 27015 on your router"
Write-Host "  4. .\start_server.ps1   or   .\auto_restart.ps1"
Write-Host ""
Write-PalLog "Install finished."
