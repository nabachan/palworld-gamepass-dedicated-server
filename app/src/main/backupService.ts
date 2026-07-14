import fs from 'fs'
import path from 'path'
import { appLogger } from './logger'
import { getSettings } from './settingsStore'
import type { BackupInfo } from '../shared/types'

function backupsRoot(): string {
  const settings = getSettings()
  const root = settings.serverPath
    ? path.join(settings.serverPath, 'PSM_Backups')
    : path.join(process.cwd(), 'PSM_Backups')
  fs.mkdirSync(root, { recursive: true })
  return root
}

export function resolveSaveGamesPath(): string {
  const settings = getSettings()
  const root = settings.serverPath
  const candidates = [
    path.join(root, 'Pal', 'Saved', 'SaveGames'),
    path.join(root, 'SaveGames'),
    path.join(root, 'Pal', 'Saved')
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  return candidates[0]
}

function dirSize(dir: string): number {
  let total = 0
  if (!fs.existsSync(dir)) return 0
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) total += dirSize(full)
    else {
      try {
        total += fs.statSync(full).size
      } catch {
        // skip
      }
    }
  }
  return total
}

function copyRecursive(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name)
    const to = path.join(dest, entry.name)
    if (entry.isDirectory()) copyRecursive(from, to)
    else fs.copyFileSync(from, to)
  }
}

function removeRecursive(target: string): void {
  if (!fs.existsSync(target)) return
  fs.rmSync(target, { recursive: true, force: true })
}

export function listBackups(): BackupInfo[] {
  const root = backupsRoot()
  const entries = fs.readdirSync(root, { withFileTypes: true }).filter((e) => e.isDirectory())
  const list: BackupInfo[] = []
  for (const e of entries) {
    const full = path.join(root, e.name)
    const metaPath = path.join(full, 'backup.json')
    let kind: 'manual' | 'auto' = e.name.includes('_auto_') ? 'auto' : 'manual'
    let createdAt = fs.statSync(full).mtime.toISOString()
    if (fs.existsSync(metaPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')) as {
          kind?: 'manual' | 'auto'
          createdAt?: string
        }
        kind = meta.kind ?? kind
        createdAt = meta.createdAt ?? createdAt
      } catch {
        // ignore
      }
    }
    list.push({
      id: e.name,
      name: e.name,
      path: full,
      createdAt,
      sizeBytes: dirSize(full),
      kind
    })
  }
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function createBackup(kind: 'manual' | 'auto' = 'manual'): Promise<BackupInfo> {
  const settings = getSettings()
  if (!settings.serverPath) {
    throw new Error('Chemin du serveur non configuré.')
  }
  const savePath = resolveSaveGamesPath()
  if (!fs.existsSync(savePath)) {
    throw new Error(`Dossier SaveGames introuvable : ${savePath}`)
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const name = `${stamp}_${kind}_save`
  const dest = path.join(backupsRoot(), name)
  fs.mkdirSync(dest, { recursive: true })
  copyRecursive(savePath, path.join(dest, 'SaveGames'))
  const info: BackupInfo = {
    id: name,
    name,
    path: dest,
    createdAt: new Date().toISOString(),
    sizeBytes: 0,
    kind
  }
  fs.writeFileSync(path.join(dest, 'backup.json'), JSON.stringify(info, null, 2), 'utf8')
  info.sizeBytes = dirSize(dest)
  fs.writeFileSync(path.join(dest, 'backup.json'), JSON.stringify(info, null, 2), 'utf8')
  appLogger.info('Backup created', info)

  await pruneOldBackups()
  return info
}

async function pruneOldBackups(): Promise<void> {
  const settings = getSettings()
  const keep = Math.max(1, settings.autoBackupKeepCount)
  const autos = listBackups().filter((b) => b.kind === 'auto')
  const extras = autos.slice(keep)
  for (const b of extras) {
    removeRecursive(b.path)
    appLogger.info('Pruned auto backup', { id: b.id })
  }
}

export function restoreBackup(id: string): void {
  const settings = getSettings()
  if (!settings.serverPath) throw new Error('Chemin du serveur non configuré.')
  const backup = listBackups().find((b) => b.id === id)
  if (!backup) throw new Error(`Backup introuvable : ${id}`)
  const src = path.join(backup.path, 'SaveGames')
  if (!fs.existsSync(src)) throw new Error('Contenu SaveGames manquant dans le backup.')

  const dest = resolveSaveGamesPath()
  // Safety backup of current state
  if (fs.existsSync(dest)) {
    const safety = path.join(backupsRoot(), `pre_restore_${Date.now()}`)
    fs.mkdirSync(safety, { recursive: true })
    copyRecursive(dest, path.join(safety, 'SaveGames'))
    fs.writeFileSync(
      path.join(safety, 'backup.json'),
      JSON.stringify({ kind: 'manual', createdAt: new Date().toISOString(), note: 'pre-restore' }),
      'utf8'
    )
  }
  removeRecursive(dest)
  copyRecursive(src, dest)
  appLogger.info('Backup restored', { id, dest })
}

export function deleteBackup(id: string): void {
  const backup = listBackups().find((b) => b.id === id)
  if (!backup) throw new Error(`Backup introuvable : ${id}`)
  removeRecursive(backup.path)
  appLogger.info('Backup deleted', { id })
}

export class BackupScheduler {
  private timer: NodeJS.Timeout | null = null

  start(): void {
    this.stop()
    const tick = async (): Promise<void> => {
      const settings = getSettings()
      if (!settings.autoBackupEnabled || !settings.serverPath) return
      try {
        await createBackup('auto')
      } catch (err) {
        appLogger.error('Auto backup failed', err)
      }
    }

    const settings = getSettings()
    const minutes = Math.max(5, settings.autoBackupIntervalMinutes || 60)
    this.timer = setInterval(() => {
      void tick()
    }, minutes * 60 * 1000)
    appLogger.info('Backup scheduler started', { minutes })
  }

  restart(): void {
    this.start()
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }
}

export const backupScheduler = new BackupScheduler()
