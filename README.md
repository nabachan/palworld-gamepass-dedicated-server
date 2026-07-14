# Palworld Dedicated Server Toolkit + Server Manager

Toolkit public Windows pour héberger un **serveur dédié Palworld** (Steam ↔ Xbox / PC Game Pass crossplay),  
plus un **dashboard desktop** Electron : [app/](app/) → `PalworldServerManager.exe`.

Ce projet n’est **pas** affilié à Pocketpair, Steam, Microsoft ou Xbox.

---

## Deux façons d’administrer

| | Scripts PowerShell | Dashboard GUI |
|--|-------------------|---------------|
| Emplacement | [`scripts/`](scripts/) | [`app/`](app/) |
| Livrable | `.ps1` | `app/release/PalworldServerManager.exe` |
| Usage | Install / start / backup CLI | UI complète (RCON, config, logs, mods) |

Guide GUI détaillé : [`app/README.md`](app/README.md)  
Journal de développement GUI : [`JOURNAL.md`](JOURNAL.md)

---

## Quick start — Dashboard

```powershell
cd app
npm install
npm run dist
# puis double-cliquer release\PalworldServerManager.exe
```

Configurer le chemin d’installation PalServer, le port RCON et le mot de passe AdminPassword dans **Paramètres**.

Dev sans serveur réel : activer le **mode simulateur** dans l’app.

---

## Quick start — Scripts serveur (SteamCMD / crossplay)

```powershell
cd scripts
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\install_server.ps1
notepad ..\config\PalWorldSettings.ini   # changer AdminPassword, activer RCON si besoin
.\setup_firewall.ps1                      # Admin
.\start_server.ps1
```

Voir la doc crossplay / ports ci-dessous ou l’historique complet dans ce README.

### Ports

| Purpose | Protocol | Port | Forward on router? |
|---------|----------|------|--------------------|
| Game | UDP | **8211** | Yes |
| Steam / community query | UDP/TCP | **27015** | Yes |
| RCON | TCP | 25575 | **No** (LAN/VPN only) |
| REST API | TCP | 8212 | **No** (LAN/VPN only) |

### Crossplay Game Pass / Xbox

1. `CrossplayPlatforms=(Steam,Xbox)` dans `PalWorldSettings.ini`
2. `bUseAuth=True`
3. Launch flag **`-publiclobby`**
4. Ports ouverts (firewall + routeur)

### Scripts disponibles

| Action | Command |
|--------|---------|
| Start | `.\start_server.ps1` |
| Stop | `.\stop_server.ps1` |
| Auto-restart | `.\auto_restart.ps1` |
| Backup | `.\backup.ps1` |
| Restore | `.\restore_backup.ps1` |
| Update | `.\update_server.ps1` |

Templates : [`config/`](config/) — référence : [`config/SETTINGS.md`](config/SETTINGS.md)

---

## Disclaimer

Palworld is © Pocketpair. This project only automates the publicly available dedicated-server workflow.  
Use at your own risk. Keep admin / RCON credentials private. Never commit real passwords.

## License

[MIT](LICENSE)
