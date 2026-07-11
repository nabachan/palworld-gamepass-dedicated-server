# Palworld Dedicated Server (Windows) — Game Pass Crossplay Toolkit

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%2010%2F11-lightgrey.svg)](#requirements)
[![SteamCMD](https://img.shields.io/badge/SteamCMD-AppID%202394010-black.svg)](#how-it-works)

Self-host a **Palworld dedicated server on Windows** with **Steam ↔ Xbox / PC Game Pass crossplay**.

This repository is a clean, public toolkit (scripts + config templates).  
It is **not** affiliated with Pocketpair, Steam, Microsoft, or Xbox.

---

## Important (read this first)

| Role | Platform | Can host dedicated server? | How to join |
|------|----------|------------------------------|-------------|
| **Server host (PC)** | Windows + SteamCMD | Yes (this toolkit) | N/A |
| **Player** | Steam | — | IP:port **or** community list |
| **Player** | Xbox / **PC Game Pass** (Microsoft Store) | **No** — Game Pass cannot run the DS binary | **Community server browser only** |

Owning Palworld on **Xbox Game Pass** does **not** give you a dedicated-server package.  
The dedicated server is the free Steam tool **AppID `2394010`**, installed with SteamCMD (no game purchase required on the host PC).

Crossplay for Game Pass / Xbox requires:

1. `CrossplayPlatforms=(Steam,Xbox)` in `PalWorldSettings.ini`
2. `bUseAuth=True`
3. Launch flag **`-publiclobby`**
4. Open ports (firewall + router)

---

## Features

- Install / update via **SteamCMD** (AppID `2394010`)
- Crossplay-ready settings template (Steam + Xbox / Game Pass)
- Launch scripts with recommended performance flags + `-publiclobby`
- Crash auto-restart watchdog
- Timestamped backups of `Pal\Saved`
- Windows Firewall helper
- Optional scheduled task (run at logon)
- Optional RCON / REST API toggles (off by default in the public template)

---

## Requirements

- Windows 10 / 11
- ~16 GB RAM recommended (8 GB is tight)
- ~30 GB free disk space
- PowerShell 5.1+ (built into Windows)
- Administrator rights for firewall / scheduled task scripts only

---

## Quick start

```powershell
# 1) Clone this repo anywhere you like
git clone https://github.com/YOUR_USERNAME/palworld-gamepass-dedicated-server.git
cd palworld-gamepass-dedicated-server\scripts

# 2) Allow scripts for this session
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# 3) Optional: edit install path / ports in ..\config\server-config.ps1

# 4) Install SteamCMD + dedicated server (downloads several GB)
.\install_server.ps1

# 5) Edit passwords / server name
#    Copy config\PalWorldSettings.ini.example → config\PalWorldSettings.ini
#    (install_server.ps1 can create the copy for you)

notepad ..\config\PalWorldSettings.ini
# Change AdminPassword at minimum

# 6) Firewall (Run PowerShell as Administrator)
.\setup_firewall.ps1

# 7) Port-forward on your router (see below), then start:
.\start_server.ps1
# or with auto-restart:
.\auto_restart.ps1
```

Show your local / public IP and the connection string for friends:

```powershell
.\show_connection_info.ps1
```

---

## Repository layout

```text
palworld-gamepass-dedicated-server/
├── README.md
├── LICENSE
├── CONTRIBUTING.md
├── SECURITY.md
├── .gitignore
├── config/
│   ├── server-config.ps1          # Paths, ports, launch args
│   ├── PalWorldSettings.ini.example
│   └── SETTINGS.md                # Setting reference
└── scripts/
    ├── install_server.ps1
    ├── update_server.ps1
    ├── start_server.ps1
    ├── stop_server.ps1
    ├── auto_restart.ps1
    ├── backup.ps1
    ├── restore_backup.ps1
    ├── setup_firewall.ps1
    ├── register_scheduled_task.ps1
    └── show_connection_info.ps1
```

Game binaries and saves are installed **outside** the git repo by default  
(`C:\PalworldDedicatedServer\`) so the repository stays small and public-safe.

---

## Ports

| Purpose | Protocol | Port | Forward on router? |
|---------|----------|------|--------------------|
| Game | UDP | **8211** | Yes |
| Steam / community query | UDP | **27015** | Yes |
| Steam / community query | TCP | **27015** | Yes |
| RCON | TCP | 25575 | **No** (LAN/VPN only) |
| REST API | TCP | 8212 | **No** (LAN/VPN only) |

### Router port forwarding (generic)

Forward to your PC's **local LAN IP** (e.g. `192.168.1.50`):

1. Open your router admin page (often `http://192.168.1.1`)
2. Find **Port Forwarding / NAT / Virtual Server / IPv4 port mapping**
3. Add the three game/query rules above
4. Reserve a DHCP lease so the LAN IP does not change

### What to share with friends

- **Steam players:** `YOUR_PUBLIC_IP:8211` or community list search by server name  
- **Xbox / Game Pass players:** community list only — search by server name (no direct IP join)

---

## Day-to-day commands

| Action | Command |
|--------|---------|
| Start | `.\start_server.ps1` |
| Stop | `.\stop_server.ps1` |
| Auto-restart loop | `.\auto_restart.ps1` |
| Backup saves | `.\backup.ps1` |
| Restore backup | `.\restore_backup.ps1` |
| Update server files | `.\update_server.ps1` (stop first) |
| Run at Windows logon | `.\register_scheduled_task.ps1` (Admin) |

---

## Configuration notes

- Edit **`config\PalWorldSettings.ini`** (created from the `.example` file).
- The running copy lives under  
  `...\server\Pal\Saved\Config\WindowsServer\PalWorldSettings.ini`.
- Scripts redeploy your config on start.
- **Always stop the server before editing** — Palworld can overwrite settings on shutdown.
- If settings seem ignored after a world already exists, `WorldOption.sav` may override INI values. Back up, then remove it only if you understand the impact.

PvP is **off** in the example template. To enable PvP you must set all three:

- `bIsPvP=True`
- `bEnablePlayerToPlayerDamage=True`
- `bEnableDefenseOtherGuildPlayer=True`

See [`config/SETTINGS.md`](config/SETTINGS.md).

---

## How it works

```text
SteamCMD (anonymous)
    → downloads AppID 2394010 (Palworld Dedicated Server)
        → PalServer.exe
            → -publiclobby + CrossplayPlatforms=(Steam,Xbox)
                → Steam & Game Pass / Xbox clients on one world
```

---

## Troubleshooting

| Symptom | Likely fix |
|---------|------------|
| `Missing configuration` on install | Use the provided scripts (SteamCMD runscript). Do not pass unquoted `+force_install_dir` from PowerShell. |
| `bind couldn't find an open port 27015` | Another PalServer (or app) already holds the port. Run `.\stop_server.ps1` first. |
| Game Pass cannot find the server | Need `-publiclobby`, query ports open, and a recognizable `ServerName`. |
| Steam IP join fails | Confirm UDP 8211 forwarded to the correct LAN IP; check public IP with `.\show_connection_info.ps1`. |
| Settings not applied | Stop server → edit `config\PalWorldSettings.ini` → start again. |

---

## Disclaimer

Palworld is © Pocketpair. This project only automates the publicly available dedicated-server workflow.  
Use at your own risk. Keep admin / RCON credentials private. Never commit real passwords.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Bug reports and improvements are welcome.

## License

[MIT](LICENSE)
