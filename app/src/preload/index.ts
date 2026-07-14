import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/types'
import type {
  ActionResult,
  AppSettings,
  AppSettingsUpdate,
  BackupInfo,
  BanListState,
  ConfigFieldMeta,
  ConfigState,
  ConfigValues,
  LogLine,
  ModInfo,
  PlayerInfo,
  ServerStatus,
  ToastPayload,
  WhitelistState
} from '../shared/types'

const api = {
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke(IPC.getSettings),
  saveSettings: (update: AppSettingsUpdate): Promise<AppSettings> =>
    ipcRenderer.invoke(IPC.saveSettings, update),
  getStatus: (): Promise<ServerStatus> => ipcRenderer.invoke(IPC.getStatus),
  startServer: (): Promise<ActionResult> => ipcRenderer.invoke(IPC.startServer),
  stopServer: (): Promise<ActionResult> => ipcRenderer.invoke(IPC.stopServer),
  restartServer: (): Promise<ActionResult> => ipcRenderer.invoke(IPC.restartServer),
  saveWorld: (): Promise<ActionResult> => ipcRenderer.invoke(IPC.saveWorld),
  getPlayers: (): Promise<PlayerInfo[]> => ipcRenderer.invoke(IPC.getPlayers),
  kickPlayer: (steamId: string): Promise<ActionResult> =>
    ipcRenderer.invoke(IPC.kickPlayer, steamId),
  banPlayer: (steamId: string): Promise<ActionResult> =>
    ipcRenderer.invoke(IPC.banPlayer, steamId),
  getWhitelist: (): Promise<WhitelistState> => ipcRenderer.invoke(IPC.getWhitelist),
  setWhitelist: (entries: string[]): Promise<WhitelistState> =>
    ipcRenderer.invoke(IPC.setWhitelist, entries),
  getBanList: (): Promise<BanListState> => ipcRenderer.invoke(IPC.getBanList),
  unbanPlayer: (steamId: string): Promise<BanListState> =>
    ipcRenderer.invoke(IPC.unbanPlayer, steamId),
  getConfig: (): Promise<ConfigState> => ipcRenderer.invoke(IPC.getConfig),
  saveConfig: (values: ConfigValues): Promise<ConfigState> =>
    ipcRenderer.invoke(IPC.saveConfig, values),
  getConfigSchema: (): Promise<ConfigFieldMeta[]> => ipcRenderer.invoke(IPC.getConfigSchema),
  listBackups: (): Promise<BackupInfo[]> => ipcRenderer.invoke(IPC.listBackups),
  createBackup: (): Promise<BackupInfo> => ipcRenderer.invoke(IPC.createBackup),
  restoreBackup: (id: string): Promise<ActionResult> =>
    ipcRenderer.invoke(IPC.restoreBackup, id),
  deleteBackup: (id: string): Promise<ActionResult> => ipcRenderer.invoke(IPC.deleteBackup, id),
  getLogs: (): Promise<LogLine[]> => ipcRenderer.invoke(IPC.getLogs),
  broadcast: (message: string): Promise<ActionResult> =>
    ipcRenderer.invoke(IPC.broadcast, message),
  listMods: (): Promise<ModInfo[]> => ipcRenderer.invoke(IPC.listMods),
  setModEnabled: (id: string, enabled: boolean): Promise<ModInfo[]> =>
    ipcRenderer.invoke(IPC.setModEnabled, id, enabled),
  pickDirectory: (): Promise<string | null> => ipcRenderer.invoke(IPC.pickDirectory),
  openPath: (target: string): Promise<string> => ipcRenderer.invoke(IPC.openPath, target),
  getAppLogPath: (): Promise<string> => ipcRenderer.invoke(IPC.getAppLogPath),
  onStatusUpdated: (cb: (status: ServerStatus) => void): (() => void) => {
    const listener = (_: Electron.IpcRendererEvent, status: ServerStatus): void => cb(status)
    ipcRenderer.on(IPC.statusUpdated, listener)
    return () => ipcRenderer.removeListener(IPC.statusUpdated, listener)
  },
  onLogsUpdated: (cb: (lines: LogLine[]) => void): (() => void) => {
    const listener = (_: Electron.IpcRendererEvent, lines: LogLine[]): void => cb(lines)
    ipcRenderer.on(IPC.logsUpdated, listener)
    return () => ipcRenderer.removeListener(IPC.logsUpdated, listener)
  },
  onToast: (cb: (toast: ToastPayload) => void): (() => void) => {
    const listener = (_: Electron.IpcRendererEvent, toast: ToastPayload): void => cb(toast)
    ipcRenderer.on(IPC.toast, listener)
    return () => ipcRenderer.removeListener(IPC.toast, listener)
  }
}

contextBridge.exposeInMainWorld('palworld', api)

export type PalworldApi = typeof api
