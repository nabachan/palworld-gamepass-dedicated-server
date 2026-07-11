#Requires -Version 5.1
<#
.SYNOPSIS
  Shared paths, ports, and launch arguments for this toolkit.

.NOTES
  Override the install root by setting environment variable:
    PALWORLD_SERVER_ROOT=D:\Games\PalworldDS

  Or edit $DefaultRoot below.
#>

$ErrorActionPreference = "Stop"

# ---------------------------------------------------------------------------
# Install root (game binaries + saves live HERE, not inside the git clone)
# ---------------------------------------------------------------------------
$DefaultRoot = "C:\PalworldDedicatedServer"
if ($env:PALWORLD_SERVER_ROOT -and $env:PALWORLD_SERVER_ROOT.Trim().Length -gt 0) {
    $Global:PalRoot = $env:PALWORLD_SERVER_ROOT.TrimEnd('\', '/')
} else {
    $Global:PalRoot = $DefaultRoot
}

$Global:SteamCmdDir   = Join-Path $PalRoot "steamcmd"
$Global:ServerDir     = Join-Path $PalRoot "server"
$Global:BackupsDir    = Join-Path $PalRoot "backups"
$Global:LogsDir       = Join-Path $PalRoot "logs"

# This git checkout (scripts/config live here)
$Global:RepoRoot      = Split-Path $PSScriptRoot -Parent
if (-not $PSScriptRoot) {
    $Global:RepoRoot = (Resolve-Path (Join-Path $PWD "..")).Path
}
# When dot-sourced from scripts\, PSScriptRoot is ...\scripts → parent is repo root.
# When this file is the entry, PSScriptRoot is ...\config → parent is repo root.
$Global:ConfigDir     = Join-Path $RepoRoot "config"
$Global:ScriptsDir    = Join-Path $RepoRoot "scripts"

# Steam dedicated server AppID
$Global:AppId         = "2394010"

$Global:ServerExe     = Join-Path $ServerDir "PalServer.exe"
$Global:SavedDir      = Join-Path $ServerDir "Pal\Saved"
$Global:WindowsConfig = Join-Path $ServerDir "Pal\Saved\Config\WindowsServer"
$Global:SettingsTarget = Join-Path $WindowsConfig "PalWorldSettings.ini"
$Global:SettingsSource = Join-Path $ConfigDir "PalWorldSettings.ini"
$Global:SettingsExample = Join-Path $ConfigDir "PalWorldSettings.ini.example"

# Ports
$Global:GamePort      = 8211
$Global:QueryPort     = 27015
$Global:RconPort      = 25575
$Global:RestApiPort   = 8212

# Launch args ( -publiclobby is required for Xbox / Game Pass community list )
$Global:LaunchArgs = @(
    "-useperfthreads",
    "-NoAsyncLoadingThread",
    "-UseMultithreadForDS",
    "-publiclobby",
    "-port=$GamePort",
    "-queryport=$QueryPort"
)

$Global:RestartDelaySec  = 10
$Global:BackupKeepCount  = 14
$Global:ProcessNameHints = @(
    "PalServer-Win64-Shipping-Cmd",
    "PalServer-Win64-Shipping",
    "PalServer"
)

function Write-PalLog {
    param([string]$Message, [string]$Level = "INFO")
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$ts] [$Level] $Message"
    Write-Host $line
    if (-not (Test-Path $LogsDir)) {
        New-Item -ItemType Directory -Path $LogsDir -Force | Out-Null
    }
    Add-Content -Path (Join-Path $LogsDir "server.log") -Value $line -Encoding UTF8
}

function Ensure-PalWorldSettings {
    if (-not (Test-Path $SettingsSource)) {
        if (-not (Test-Path $SettingsExample)) {
            throw "Missing example settings: $SettingsExample"
        }
        Copy-Item -Path $SettingsExample -Destination $SettingsSource -Force
        Write-PalLog "Created $SettingsSource from example. Edit AdminPassword before going public." "WARN"
    }
}

function Invoke-SteamCmd {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Commands
    )

    $steamCmdExe = Join-Path $SteamCmdDir "steamcmd.exe"
    if (-not (Test-Path $steamCmdExe)) {
        throw "steamcmd.exe not found: $steamCmdExe"
    }
    if (-not (Test-Path $LogsDir)) {
        New-Item -ItemType Directory -Path $LogsDir -Force | Out-Null
    }

    $scriptPath = Join-Path $LogsDir "steamcmd_runscript.txt"
    $installDir = ($ServerDir -replace '\\', '/').TrimEnd('/')

    $lines = @(
        "@ShutdownOnFailedCommand 1",
        "@NoPromptForPassword 1",
        "force_install_dir $installDir",
        "login anonymous"
    ) + $Commands + @("quit")

    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllLines($scriptPath, $lines, $utf8NoBom)

    Write-PalLog "SteamCMD runscript: $scriptPath"
    Get-Content $scriptPath | ForEach-Object { Write-Host "  > $_" }

    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        $p = Start-Process -FilePath $steamCmdExe `
            -ArgumentList @("+runscript", $scriptPath) `
            -WorkingDirectory $SteamCmdDir `
            -NoNewWindow `
            -Wait `
            -PassThru
        $code = $p.ExitCode
    } finally {
        $ErrorActionPreference = $prev
    }

    if ($null -eq $code) { $code = 0 }
    return [int]$code
}
