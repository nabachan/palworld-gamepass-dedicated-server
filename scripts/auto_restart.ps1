#Requires -Version 5.1
<#
.SYNOPSIS
  Watchdog: restart the dedicated server if it crashes.
#>

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\..\config\server-config.ps1"

function Get-PalServerProcess {
    Get-Process -ErrorAction SilentlyContinue |
        Where-Object { $ProcessNameHints -contains $_.ProcessName }
}

function Start-PalServerDetached {
    if (-not (Test-Path $ServerExe)) {
        throw "PalServer.exe not found. Run install_server.ps1 first."
    }
    Ensure-PalWorldSettings
    if (-not (Test-Path $WindowsConfig)) {
        New-Item -ItemType Directory -Path $WindowsConfig -Force | Out-Null
    }
    Copy-Item -Path $SettingsSource -Destination $SettingsTarget -Force

    $p = Start-Process -FilePath $ServerExe `
        -ArgumentList $LaunchArgs `
        -WorkingDirectory $ServerDir `
        -WindowStyle Minimized `
        -PassThru
    Write-PalLog "Server started (PID $($p.Id))"
    return $p
}

Write-Host "=== Palworld auto-restart ===" -ForegroundColor Cyan
Write-Host "Restart delay: $RestartDelaySec s"
Write-Host "Ctrl+C stops the watchdog (server may keep running)."
Write-Host "Full stop: .\stop_server.ps1"
Write-Host ""
Write-PalLog "Watchdog started."

while ($true) {
    $procs = @(Get-PalServerProcess)
    if ($procs.Count -eq 0) {
        Write-PalLog "No server process detected - restarting..." "WARN"
        try {
            Start-PalServerDetached | Out-Null
        } catch {
            Write-PalLog "Start failed: $_" "ERROR"
        }
        Start-Sleep -Seconds $RestartDelaySec
    } else {
        Start-Sleep -Seconds 15
    }
}
