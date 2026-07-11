# Contributing

Thanks for helping improve this toolkit.

## Scope

This project is a **Windows PowerShell toolkit** for self-hosting the Palworld dedicated server with Steam ↔ Xbox / PC Game Pass crossplay.

Please keep contributions focused on:

- Script reliability (SteamCMD, start/stop, backups, firewall)
- Documentation clarity
- Crossplay / networking guidance accuracy

Out of scope (unless discussed in an issue first):

- Linux / Docker packaging (separate project territory)
- Game client mods
- Paid hosting control panels

## Ground rules

1. **Do not commit secrets** — real `AdminPassword`, RCON keys, personal IPs, or save games.
2. Keep `PalWorldSettings.ini` gitignored; only commit `PalWorldSettings.ini.example`.
3. Prefer ASCII in `.ps1` files (or UTF-8 **with BOM**) so Windows PowerShell 5.1 parses them reliably.
4. Use SteamCMD **runscript** (or fully quoted `"+force_install_dir ..."`) — unquoted `+` args break under PowerShell and cause `Missing configuration`.
5. Open an issue before large refactors.

## Development tips

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
cd scripts
# Point installs somewhere disposable while testing:
$env:PALWORLD_SERVER_ROOT = "C:\PalworldDedicatedServer-dev"
.\install_server.ps1
```

## Pull requests

- Describe the problem and how you tested on Windows 10/11
- Keep diffs small and focused
- Update README / SETTINGS.md when behavior changes
