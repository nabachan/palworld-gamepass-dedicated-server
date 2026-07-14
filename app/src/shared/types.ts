/** Shared IPC / domain types for Palworld Server Manager */

export type ServerOnlineStatus = 'online' | 'offline' | 'starting' | 'stopping' | 'unknown'

export interface AppSettings {
  serverPath: string
  rconHost: string
  rconPort: number
  /** Presence flag only — password never sent back in clear after save */
  hasRconPassword: boolean
  gamePort: number
  autoBackupEnabled: boolean
  autoBackupIntervalMinutes: number
  autoBackupKeepCount: number
  launchArgs: string
  useSimulator: boolean
  language: 'fr' | 'en'
}

export interface AppSettingsUpdate {
  serverPath?: string
  rconHost?: string
  rconPort?: number
  rconPassword?: string
  gamePort?: number
  autoBackupEnabled?: boolean
  autoBackupIntervalMinutes?: number
  autoBackupKeepCount?: number
  launchArgs?: string
  useSimulator?: boolean
  language?: 'fr' | 'en'
}

export interface ServerProcessStats {
  running: boolean
  pid: number | null
  cpuPercent: number
  memoryMb: number
  uptimeSeconds: number
  startedAt: string | null
}

export interface ServerStatus {
  process: ServerProcessStats
  rconConnected: boolean
  onlineStatus: ServerOnlineStatus
  playerCount: number
  maxPlayers: number
  serverName: string
  lastError: string | null
  lastUpdatedAt: string
}

export interface PlayerInfo {
  name: string
  playerUid: string
  steamId: string
}

export interface BackupInfo {
  id: string
  name: string
  path: string
  createdAt: string
  sizeBytes: number
  kind: 'manual' | 'auto'
}

export interface ModInfo {
  id: string
  name: string
  path: string
  enabled: boolean
  sizeBytes: number
}

export interface LogLine {
  id: string
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug' | 'unknown'
  message: string
  raw: string
}

export type ConfigValueType = 'boolean' | 'number' | 'string' | 'enum' | 'list'

export interface ConfigFieldMeta {
  key: string
  label: string
  description: string
  type: ConfigValueType
  category: string
  min?: number
  max?: number
  step?: number
  options?: string[]
  unit?: string
}

export type ConfigValues = Record<string, string | number | boolean>

export interface ConfigState {
  path: string
  exists: boolean
  values: ConfigValues
  rawSnippet: string
  lastLoadedAt: string
  warnings: string[]
}

export interface BroadcastResult {
  ok: boolean
  message: string
}

export interface ActionResult {
  ok: boolean
  message: string
  details?: string
}

export interface WhitelistState {
  path: string
  exists: boolean
  entries: string[]
}

export interface BanListState {
  path: string
  exists: boolean
  entries: string[]
}

export const IPC = {
  getSettings: 'settings:get',
  saveSettings: 'settings:save',
  getStatus: 'server:status',
  startServer: 'server:start',
  stopServer: 'server:stop',
  restartServer: 'server:restart',
  saveWorld: 'server:save',
  getPlayers: 'players:list',
  kickPlayer: 'players:kick',
  banPlayer: 'players:ban',
  getWhitelist: 'players:whitelist:get',
  setWhitelist: 'players:whitelist:set',
  getBanList: 'players:banlist:get',
  unbanPlayer: 'players:unban',
  getConfig: 'config:get',
  saveConfig: 'config:save',
  getConfigSchema: 'config:schema',
  listBackups: 'backups:list',
  createBackup: 'backups:create',
  restoreBackup: 'backups:restore',
  deleteBackup: 'backups:delete',
  getLogs: 'logs:get',
  broadcast: 'broadcast:send',
  listMods: 'mods:list',
  setModEnabled: 'mods:setEnabled',
  pickDirectory: 'dialog:pickDirectory',
  openPath: 'shell:openPath',
  getAppLogPath: 'app:logPath',
  // push events
  statusUpdated: 'event:status',
  logsUpdated: 'event:logs',
  toast: 'event:toast'
} as const

export type IpcChannel = (typeof IPC)[keyof typeof IPC]

export interface ToastPayload {
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
}
