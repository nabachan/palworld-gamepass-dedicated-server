import fs from 'fs'
import path from 'path'
import { appLogger } from './logger'
import { getSettings } from './settingsStore'
import type { BanListState, ModInfo, WhitelistState } from '../shared/types'

export function resolveModsDir(): string {
  const root = getSettings().serverPath
  const candidates = [
    path.join(root, 'Pal', 'Content', 'Paks', '~mods'),
    path.join(root, 'Pal', 'Content', 'Paks', 'Mods'),
    path.join(root, 'Mods'),
    path.join(root, 'mods')
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  // Default created on demand
  const preferred = candidates[0]
  return preferred
}

export function listMods(): ModInfo[] {
  const settings = getSettings()
  if (!settings.serverPath) return []
  const dir = resolveModsDir()
  if (!fs.existsSync(dir)) return []

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const mods: ModInfo[] = []
  for (const e of entries) {
    if (!e.isFile()) continue
    const name = e.name
    if (!/\.(pak|zip|disabled)$/i.test(name) && !name.endsWith('.pak.disabled')) continue
    const full = path.join(dir, name)
    const enabled = !name.endsWith('.disabled')
    const display = name.replace(/\.disabled$/i, '')
    mods.push({
      id: name,
      name: display,
      path: full,
      enabled,
      sizeBytes: fs.statSync(full).size
    })
  }
  return mods.sort((a, b) => a.name.localeCompare(b.name))
}

export function setModEnabled(id: string, enabled: boolean): ModInfo[] {
  const mods = listMods()
  const mod = mods.find((m) => m.id === id)
  if (!mod) throw new Error(`Mod introuvable : ${id}`)

  const currentlyEnabled = mod.enabled
  if (currentlyEnabled === enabled) return listMods()

  const dir = path.dirname(mod.path)
  let nextName: string
  if (enabled) {
    nextName = mod.name.endsWith('.pak') || mod.name.endsWith('.zip') ? mod.name : `${mod.name}.pak`
    // strip .disabled
    nextName = mod.id.replace(/\.disabled$/i, '')
  } else {
    nextName = mod.id.endsWith('.disabled') ? mod.id : `${mod.id}.disabled`
  }
  const nextPath = path.join(dir, nextName)
  fs.renameSync(mod.path, nextPath)
  appLogger.info('Mod toggled', { id, enabled, nextName })
  return listMods()
}

function whitelistPath(): string {
  const root = getSettings().serverPath
  return path.join(root, 'Pal', 'Saved', 'SaveGames', 'whitelist.txt')
}

function banlistPath(): string {
  const root = getSettings().serverPath
  // Local ban file managed by the app (in addition to RCON BanPlayer)
  return path.join(root, 'Pal', 'Saved', 'SaveGames', 'banlist.txt')
}

function readLines(file: string): string[] {
  if (!fs.existsSync(file)) return []
  return fs
    .readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
}

function writeLines(file: string, lines: string[]): void {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, lines.join('\n') + '\n', 'utf8')
}

export function getWhitelist(): WhitelistState {
  const p = whitelistPath()
  return { path: p, exists: fs.existsSync(p), entries: readLines(p) }
}

export function setWhitelist(entries: string[]): WhitelistState {
  const cleaned = [...new Set(entries.map((e) => e.trim()).filter(Boolean))]
  writeLines(whitelistPath(), cleaned)
  appLogger.info('Whitelist updated', { count: cleaned.length })
  return getWhitelist()
}

export function getBanList(): BanListState {
  const p = banlistPath()
  return { path: p, exists: fs.existsSync(p), entries: readLines(p) }
}

export function addBan(steamId: string): BanListState {
  const current = getBanList().entries
  if (!current.includes(steamId)) current.push(steamId)
  writeLines(banlistPath(), current)
  return getBanList()
}

export function removeBan(steamId: string): BanListState {
  const current = getBanList().entries.filter((e) => e !== steamId)
  writeLines(banlistPath(), current)
  return getBanList()
}
