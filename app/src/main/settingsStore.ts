import { app, safeStorage } from 'electron'
import fs from 'fs'
import path from 'path'
import type { AppSettings, AppSettingsUpdate } from '../shared/types'
import { appLogger } from './logger'

const SETTINGS_FILE = 'settings.json'
const SECRET_FILE = 'rcon.secret'

interface PersistedSettings {
  serverPath: string
  rconHost: string
  rconPort: number
  gamePort: number
  autoBackupEnabled: boolean
  autoBackupIntervalMinutes: number
  autoBackupKeepCount: number
  launchArgs: string
  useSimulator: boolean
  language: 'fr' | 'en'
}

const DEFAULTS: PersistedSettings = {
  serverPath: '',
  rconHost: '127.0.0.1',
  rconPort: 25575,
  gamePort: 8211,
  autoBackupEnabled: true,
  autoBackupIntervalMinutes: 60,
  autoBackupKeepCount: 10,
  launchArgs: '-useperfthreads -NoAsyncLoadingThread -UseMultithreadForDS -publiclobby',
  useSimulator: false,
  language: 'fr'
}

function settingsPath(): string {
  return path.join(app.getPath('userData'), SETTINGS_FILE)
}

function secretPath(): string {
  return path.join(app.getPath('userData'), SECRET_FILE)
}

function readPersisted(): PersistedSettings {
  try {
    const file = settingsPath()
    if (!fs.existsSync(file)) return { ...DEFAULTS }
    const raw = fs.readFileSync(file, 'utf8')
    const parsed = JSON.parse(raw) as Partial<PersistedSettings>
    return { ...DEFAULTS, ...parsed }
  } catch (err) {
    appLogger.error('Failed to read settings', err)
    return { ...DEFAULTS }
  }
}

function writePersisted(settings: PersistedSettings): void {
  const file = settingsPath()
  fs.writeFileSync(file, JSON.stringify(settings, null, 2), 'utf8')
}

export function getRconPassword(): string {
  try {
    const file = secretPath()
    if (!fs.existsSync(file)) return ''
    const buf = fs.readFileSync(file)
    if (safeStorage.isEncryptionAvailable()) {
      return safeStorage.decryptString(buf)
    }
    // Fallback: base64 obfuscation (not encryption) when OS keychain unavailable
    return Buffer.from(buf.toString('utf8'), 'base64').toString('utf8')
  } catch (err) {
    appLogger.error('Failed to decrypt RCON password', err)
    return ''
  }
}

function setRconPassword(password: string): void {
  const file = secretPath()
  if (!password) {
    if (fs.existsSync(file)) fs.unlinkSync(file)
    return
  }
  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(password)
    fs.writeFileSync(file, encrypted)
    appLogger.info('RCON password stored with OS safeStorage encryption')
  } else {
    // Obfuscate only — document limitation
    fs.writeFileSync(file, Buffer.from(password, 'utf8').toString('base64'), 'utf8')
    appLogger.warn('safeStorage unavailable; RCON password stored obfuscated (base64)')
  }
}

export function getSettings(): AppSettings {
  const persisted = readPersisted()
  const password = getRconPassword()
  return {
    ...persisted,
    hasRconPassword: Boolean(password)
  }
}

export function saveSettings(update: AppSettingsUpdate): AppSettings {
  const current = readPersisted()
  const next: PersistedSettings = {
    serverPath: update.serverPath ?? current.serverPath,
    rconHost: update.rconHost ?? current.rconHost,
    rconPort: update.rconPort ?? current.rconPort,
    gamePort: update.gamePort ?? current.gamePort,
    autoBackupEnabled: update.autoBackupEnabled ?? current.autoBackupEnabled,
    autoBackupIntervalMinutes:
      update.autoBackupIntervalMinutes ?? current.autoBackupIntervalMinutes,
    autoBackupKeepCount: update.autoBackupKeepCount ?? current.autoBackupKeepCount,
    launchArgs: update.launchArgs ?? current.launchArgs,
    useSimulator: update.useSimulator ?? current.useSimulator,
    language: update.language ?? current.language
  }

  writePersisted(next)

  if (update.rconPassword !== undefined) {
    setRconPassword(update.rconPassword)
  }

  appLogger.info('Settings saved', {
    serverPath: next.serverPath,
    rconHost: next.rconHost,
    rconPort: next.rconPort,
    useSimulator: next.useSimulator
  })

  return getSettings()
}

export function getUserDataPath(): string {
  return app.getPath('userData')
}
