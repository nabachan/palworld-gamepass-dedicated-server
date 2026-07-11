#Requires -Version 5.1
<#
.SYNOPSIS
  Stop Palworld dedicated server processes (and matching watchdog windows).
#>

$ErrorActionPreference = "Continue"
. "$PSScriptRoot\..\config\server-config.ps1"

Write-Host "Stopping PalServer processes..." -ForegroundColor Yellow
$procs = Get-Process -ErrorAction SilentlyContinue |
    Where-Object { $ProcessNameHints -contains $_.ProcessName }

if (-not $procs) {
    Write-Host "No server process running." -ForegroundColor Green
} else {
    foreach ($p in $procs) {
        Write-Host "  Stop PID $($p.Id) ($($p.ProcessName))"
        Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
    Write-PalLog "Server stopped via stop_server.ps1"
    Write-Host "Server stopped." -ForegroundColor Green
}

$watchdogs = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -and $_.CommandLine -match "auto_restart\.ps1" }
foreach ($w in $watchdogs) {
    Write-Host "  Stop watchdog PID $($w.ProcessId)"
    Stop-Process -Id $w.ProcessId -Force -ErrorAction SilentlyContinue
}
