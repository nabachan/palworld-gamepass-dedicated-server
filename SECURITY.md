# Security Policy

## Reporting a vulnerability

If you discover a security issue in these scripts (for example unsafe defaults that expose admin access), please open a **private** GitHub security advisory if available, or an issue **without** including real credentials / personal IPs.

## Hardening checklist for operators

- Change `AdminPassword` before exposing the server
- Prefer a `ServerPassword` for private friend groups
- Do **not** port-forward RCON (25575) or REST (8212) to the public internet
- Keep Windows and the dedicated server updated (`.\update_server.ps1`)
- Never commit `config/PalWorldSettings.ini` with real secrets
- Run regular backups (`.\backup.ps1`) and store copies offline

## Disclaimer

This toolkit installs third-party software (SteamCMD / Palworld Dedicated Server).  
You are responsible for how you expose services on your network.
