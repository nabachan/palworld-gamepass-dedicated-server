# JOURNAL.md — Palworld Server Manager

Journal de décisions techniques, tests et bugs pour le dashboard Electron.

## Objectif

Application desktop Windows (exécutable unique) pour gérer un serveur dédié Palworld :
RCON, config INI, saves, logs, mods, contrôles Start/Stop/Restart.

## Décisions techniques

| Décision | Choix | Hypothèse / raison |
|----------|-------|--------------------|
| Stack UI | Electron 34 + Vite + React 19 + TypeScript | Stack imposée ; electron-vite pour le tooling moderne |
| RCON | `rcon-client` | Lib maintenue, protocole Source RCON compatible Palworld |
| Secrets | Electron `safeStorage` (+ fallback base64) | Chiffrement OS si dispo ; sinon obfuscation documentée |
| Emplacement app | `/app` dans le dépôt toolkit existant | Conserve les scripts PowerShell / templates INI du repo |
| Tests sans Palworld | Mock RCON JS + layout SaveGames/config/logs/mods | Pas de binaire PalServer sur l’agent Linux |
| Build Windows depuis Linux | electron-builder `portable` + Wine | Produit `release/PalworldServerManager.exe` (NSIS portable) |
| Backups auto | `setInterval` interne (pas cron OS) | Simple, portable, configurable dans l’UI |
| Mods | Rename `.pak` ↔ `.pak.disabled` | Convention courante PAK Unreal ; redémarrage serveur recommandé |
| Whitelist | Fichier local `whitelist.txt` géré par l’app | Palworld n’a pas d’API RCON whitelist standard fiable |
| Langue UI | Français (descriptions config FR) | Brief utilisateur en français |
| Direction artistique | Bleus/verts doux, orange chaud, fond nature sombre | Évite le néon cyberpunk générique cyan/magenta |

## Architecture

```
app/
  src/main/       process Electron : RCON, process, config, backups, logs, IPC
  src/preload/    bridge contextIsolation
  src/renderer/   React UI (sidebar + panneaux)
  src/shared/     types, schéma config, parseurs purs
  resources/      mock-palworld-server.js (embarqué dans le build)
  scripts/        e2e / smoke tests
  release/        PalworldServerManager.exe + win-unpacked/
```

## Fonctionnalités livrées

1. Vue d’ensemble : statut, joueurs, uptime, CPU/RAM process, Start/Stop/Restart/Save
2. Joueurs : ShowPlayers, kick, ban, whitelist locale, banlist locale
3. Éditeur config : tous les champs OptionSettings connus, formulaires typés + descriptions
4. Sauvegardes : liste, création manuelle, restauration (avec copie pré-restore), auto + rétention
5. Logs live : watch fichier Pal.log + filtre/recherche
6. Broadcast RCON
7. Mods : liste / activer / désactiver
8. Paramètres : chemin serveur, RCON host/port/password sécurisé, mode simulateur
9. Logs internes `app.log` dans userData

## Bugs rencontrés et corrigés

1. **Imports renderer → shared** : `App.tsx` utilisait `../../../shared` (incorrect) → corrigé en `../../shared`.
2. **Tests unitaires + Electron** : parse INI/joueurs dépendait de modules electron → extrait vers `src/shared/iniCodec.ts` et `parsePlayers.ts`.
3. **E2E RCON port conflict** : simulateur orphelin réutilisait un port → port aléatoire + kill process group + wait layout.
4. **Set iteration TS** : `target` compilateur passé à `ES2022`.
5. **electron-builder portable sous Linux** : échec sans Wine → installation Wine + `CSC_IDENTITY_AUTO_DISCOVERY=false`.
6. **Simulateur packagé** : `npx tsx` indisponible dans le .exe → mock JS embarqué + `ELECTRON_RUN_AS_NODE`.

## Tests effectués

| Test | Résultat |
|------|----------|
| `npm test` (vitest parse INI / ShowPlayers) | OK |
| `npm run test:e2e` (RCON mock + config + backup + logs + mods) | OK |
| `npm run test:smoke` (mock JS + services fichier) | OK |
| `npm run typecheck` | OK |
| `npm run build` (electron-vite) | OK |
| Lancement Electron via `xvfb-run` (preview 12s) | OK (démarrage + quit propre ; warnings DBus/GPU headless attendus) |
| `npm run dist` → `release/PalworldServerManager.exe` (PE Windows portable ~72 Mo) | OK |

## Limitations connues

- **CPU/RAM** : basés sur `systeminformation` pour le PID détecté ; précision variable selon l’OS.
- **safeStorage** : sous certains environnements CI/headless, fallback base64 (pas un vrai chiffrement).
- **Whitelist** : fichier local d’aide ; le serveur Palworld officiel peut nécessiter d’autres mécanismes.
- **Start réel** : testé via simulateur sur Linux ; le lancement de `PalServer.exe` doit être validé sur une machine Windows avec installation SteamCMD.
- **WorldOption.sav** : peut surcharger l’INI en jeu (limitation Palworld, documentée dans le toolkit existant).
- **Icône app** : icône Electron par défaut (pas d’asset brand custom fourni).
- **Fonts** : Nunito/Outfit chargées depuis Google Fonts si réseau dispo ; fallback Segoe UI sinon.

## Build final

- Exécutable portable : `app/release/PalworldServerManager.exe`
- Version décompressée : `app/release/win-unpacked/PalworldServerManager.exe`
- Relancer : `cd app && npm run dist` (Wine requis pour cross-build Linux → Windows)
