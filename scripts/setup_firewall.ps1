#Requires -Version 5.1
#Requires -RunAsAdministrator
<#
.SYNOPSIS
  Create Windows Firewall inbound allow rules for the dedicated server.
#>

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\..\config\server-config.ps1"

function Set-PalFirewallRule {
    param(
        [string]$Name,
        [string]$Protocol,
        [int]$Port
    )
    $existing = Get-NetFirewallRule -DisplayName $Name -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "  (update) $Name" -ForegroundColor DarkYellow
        Remove-NetFirewallRule -DisplayName $Name -ErrorAction SilentlyContinue
    } else {
        Write-Host "  (new) $Name" -ForegroundColor Green
    }
    New-NetFirewallRule `
        -DisplayName $Name `
        -Direction Inbound `
        -Action Allow `
        -Protocol $Protocol `
        -LocalPort $Port `
        -Profile Any `
        -Enabled True | Out-Null
}

Write-Host "=== Windows Firewall - Palworld Dedicated Server ===" -ForegroundColor Cyan
Write-Host ""

Set-PalFirewallRule -Name "Palworld DS Game UDP $GamePort"    -Protocol UDP -Port $GamePort
Set-PalFirewallRule -Name "Palworld DS Query UDP $QueryPort"  -Protocol UDP -Port $QueryPort
Set-PalFirewallRule -Name "Palworld DS Query TCP $QueryPort"  -Protocol TCP -Port $QueryPort
Set-PalFirewallRule -Name "Palworld DS RCON TCP $RconPort"    -Protocol TCP -Port $RconPort
Set-PalFirewallRule -Name "Palworld DS REST TCP $RestApiPort" -Protocol TCP -Port $RestApiPort

Write-Host ""
Write-Host "Rules applied." -ForegroundColor Green
Get-NetFirewallRule -DisplayName "Palworld DS*" |
    Get-NetFirewallPortFilter |
    Format-Table Protocol, LocalPort -AutoSize

Write-Host @"

Exact netsh equivalents:

  netsh advfirewall firewall add rule name="Palworld DS Game UDP 8211"   dir=in action=allow protocol=UDP localport=8211
  netsh advfirewall firewall add rule name="Palworld DS Query UDP 27015" dir=in action=allow protocol=UDP localport=27015
  netsh advfirewall firewall add rule name="Palworld DS Query TCP 27015" dir=in action=allow protocol=TCP localport=27015
  netsh advfirewall firewall add rule name="Palworld DS RCON TCP 25575"  dir=in action=allow protocol=TCP localport=25575
  netsh advfirewall firewall add rule name="Palworld DS REST TCP 8212"   dir=in action=allow protocol=TCP localport=8212

Do NOT port-forward RCON/REST to the public internet unless you know the risks.

"@
