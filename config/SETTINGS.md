# Settings reference

The live file used by scripts is `config/PalWorldSettings.ini`  
(created from `PalWorldSettings.ini.example`).

Palworld expects `OptionSettings=(...)` on a **single line**.  
Use `;` for comments above the section header.

## Crossplay (required for Game Pass / Xbox)

| Key | Value | Why |
|-----|-------|-----|
| `CrossplayPlatforms` | `(Steam,Xbox)` | Allow Steam + Xbox / PC Game Pass |
| `bUseAuth` | `True` | Required for crossplay auth |
| Launch flag | `-publiclobby` | Game Pass / Xbox use the community browser only |

Optional platforms: `PS5`, `Mac` (add inside the parentheses if needed).

## Identity & access

| Key | Notes |
|-----|-------|
| `ServerName` | Shown in the community browser |
| `ServerDescription` | Short blurb |
| `ServerPassword` | Empty = open join |
| `AdminPassword` | **Change this** — admin / RCON / REST |
| `ServerPlayerMaxNum` | 1–32 (12 is a sensible home-PC default) |
| `PublicPort` | Advertised game port (8211) |
| `PublicIP` | Usually leave empty |

## Casual co-op defaults in the example

| Key | Example value |
|-----|---------------|
| `ExpRate` | 2.0 |
| `PalCaptureRate` | 2.0 |
| `CollectionDropRate` | 2.0 |
| `ItemWeightRate` | 0.4 |
| `DeathPenalty` | Item |
| `BuildObjectDeteriorationDamageRate` | 0 (no structure decay) |
| `PalEggDefaultHatchingTime` | 1.0 hour |
| `AutoSaveSpan` | 30 seconds |
| `bIsPvP` | False |

## RCON / REST

Disabled in the public example (`RCONEnabled=False`, `RESTAPIEnabled=False`).  
If you enable them, do **not** port-forward those ports to the internet.

## PvP

Enable all three or PvP will not work:

1. `bIsPvP=True`
2. `bEnablePlayerToPlayerDamage=True`
3. `bEnableDefenseOtherGuildPlayer=True`
