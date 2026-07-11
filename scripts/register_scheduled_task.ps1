#Requires -Version 5.1
#Requires -RunAsAdministrator
<#
.SYNOPSIS
  Register a Windows scheduled task to run auto_restart.ps1 at logon.
#>

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\..\config\server-config.ps1"

$taskName = "PalworldDedicatedServer"
$script = Join-Path $ScriptsDir "auto_restart.ps1"

$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$script`""

$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -ExecutionTimeLimit ([TimeSpan]::Zero)

$principal = New-ScheduledTaskPrincipal `
    -UserId $env:USERNAME `
    -LogonType Interactive `
    -RunLevel Highest

Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Principal $principal `
    -Force | Out-Null

Write-Host "Scheduled task created: $taskName" -ForegroundColor Green
Write-Host "Start now:  Start-ScheduledTask -TaskName '$taskName'"
Write-Host "Stop:       .\stop_server.ps1 ; Stop-ScheduledTask -TaskName '$taskName'"
Write-Host "Remove:     Unregister-ScheduledTask -TaskName '$taskName' -Confirm:`$false"
