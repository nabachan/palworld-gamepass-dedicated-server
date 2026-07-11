#Requires -Version 5.1
<#
.SYNOPSIS
  Print local IP, public IP, and connection instructions for players.
#>

$ErrorActionPreference = "Continue"
. "$PSScriptRoot\..\config\server-config.ps1"

Write-Host "=== Palworld connection info ===" -ForegroundColor Cyan
Write-Host ""

$local = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object {
        $_.IPAddress -notlike "127.*" -and
        $_.PrefixOrigin -ne "WellKnown" -and
        $_.IPAddress -notlike "169.254.*"
    } |
    Sort-Object InterfaceMetric |
    Select-Object -First 1

$localIp = if ($local) { $local.IPAddress } else { "(not found)" }

Write-Host "Local IP (use this as the router port-forward target):" -ForegroundColor Yellow
Write-Host "  $localIp"
Write-Host ""

Write-Host "Public IP (share with Steam friends):" -ForegroundColor Yellow
$publicIp = $null
try {
    $publicIp = (Invoke-RestMethod -Uri "https://api.ipify.org" -TimeoutSec 10).Trim()
    Write-Host "  $publicIp"
} catch {
    Write-Host "  (lookup failed - try https://whatismyipaddress.com)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Share with players ===" -ForegroundColor Green
Write-Host ""
Write-Host "STEAM:"
if ($publicIp) {
    Write-Host "  Direct connect: ${publicIp}:${GamePort}"
} else {
    Write-Host "  Direct connect: <YOUR_PUBLIC_IP>:${GamePort}"
}
Write-Host "  Or search the community list by your ServerName"
Write-Host ""
Write-Host "XBOX / PC GAME PASS:"
Write-Host "  No direct IP join."
Write-Host "  Multiplayer -> Community servers -> search your ServerName"
Write-Host "  Requires -publiclobby (already set in start_server.ps1)"
Write-Host ""
Write-Host "Router port forwards toward $localIp :"
Write-Host "  UDP $GamePort   (game)"
Write-Host "  UDP $QueryPort  (query)"
Write-Host "  TCP $QueryPort  (query)"
Write-Host "  TCP $RconPort / $RestApiPort = optional admin only (LAN/VPN recommended)"
