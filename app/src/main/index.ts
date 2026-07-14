import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import path from 'path'
import { IPC } from '../shared/types'
import type {
  ActionResult,
  AppSettingsUpdate,
  ConfigValues,
  ServerStatus,
  ToastPayload
} from '../shared/types'
import { appLogger } from './logger'
import { getSettings, saveSettings, getRconPassword } from './settingsStore'
import { rconService } from './rconService'
import { processManager } from './processManager'
import { loadConfig, saveConfig, getConfigSchema } from './configService'
import {
  listBackups,
  createBackup,
  restoreBackup,
  deleteBackup,
  backupScheduler
} from './backupService'
import { logWatcher } from './logService'
import {
  listMods,
  setModEnabled,
  getWhitelist,
  setWhitelist,
  getBanList,
  addBan,
  removeBan
} from './modsAndPlayersFiles'

let mainWindow: BrowserWindow | null = null
let statusTimer: NodeJS.Timeout | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'Palworld Server Manager',
    backgroundColor: '#0f1a14',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  if (process.env.PSM_AUTO_CAPTURE === '1') {
    mainWindow.webContents.on('did-finish-load', () => {
      void runAutoCapture(mainWindow!)
    })
  }
}

async function runAutoCapture(win: BrowserWindow): Promise<void> {
  const fs = await import('fs')
  const outDir = process.env.PSM_CAPTURE_DIR || path.join(process.cwd(), '..', 'docs', 'screenshots')
  fs.mkdirSync(outDir, { recursive: true })

  const pages = [
    { label: "Vue d'ensemble", file: '01-overview.png', extra: 'start' },
    { label: 'Joueurs', file: '02-players.png' },
    { label: 'Configuration', file: '03-config.png' },
    { label: 'Sauvegardes', file: '04-backups.png' },
    { label: 'Logs', file: '05-logs.png' },
    { label: 'Annonces', file: '06-broadcast.png', extra: 'broadcast' },
    { label: 'Mods', file: '07-mods.png' },
    { label: 'Paramètres', file: '08-settings.png' }
  ]

  const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))
  await sleep(2500)

  for (const page of pages) {
    await win.webContents.executeJavaScript(`
      (() => {
        const buttons = [...document.querySelectorAll('button.nav-btn')];
        const btn = buttons.find(b => (b.textContent || '').includes(${JSON.stringify(page.label)}));
        if (btn) btn.click();
        return btn ? (btn.textContent || '').trim() : 'NOT_FOUND';
      })()
    `)
    await sleep(900)

    if (page.extra === 'start') {
      await win.webContents.executeJavaScript(`
        (() => {
          const btn = [...document.querySelectorAll('button')].find(b => /^\\s*Start\\s*$/i.test(b.textContent || ''));
          if (btn) btn.click();
          return !!btn;
        })()
      `)
      await sleep(2500)
      const online = await win.capturePage()
      fs.writeFileSync(path.join(outDir, '01b-overview-online.png'), online.toPNG())
      appLogger.info('Captured 01b-overview-online.png')
    }

    if (page.extra === 'broadcast') {
      await win.webContents.executeJavaScript(`
        (() => {
          const ta = document.querySelector('textarea');
          if (ta) {
            const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
            setter?.call(ta, 'Maintenance dans 5 minutes — bonne chasse !');
            ta.dispatchEvent(new Event('input', { bubbles: true }));
          }
          return !!ta;
        })()
      `)
      await sleep(400)
    }

    const img = await win.capturePage()
    fs.writeFileSync(path.join(outDir, page.file), img.toPNG())
    appLogger.info(`Captured ${page.file}`)
  }

  // Cover = overview again
  await win.webContents.executeJavaScript(`
    [...document.querySelectorAll('button.nav-btn')].find(b => (b.textContent||'').includes("Vue d'ensemble"))?.click()
  `)
  await sleep(1000)
  const cover = await win.capturePage()
  fs.writeFileSync(path.join(outDir, '00-cover.png'), cover.toPNG())
  fs.writeFileSync(path.join(outDir, 'hero.png'), cover.toPNG())
  appLogger.info('Auto-capture complete')

  // Signal for shell wrapper
  fs.writeFileSync(path.join(outDir, '.capture-done'), new Date().toISOString())
  app.quit()
}

function sendToast(payload: ToastPayload): void {
  mainWindow?.webContents.send(IPC.toast, payload)
}

async function buildStatus(): Promise<ServerStatus> {
  const processStats = await processManager.getStats()
  const settings = getSettings()
  let rconConnected = false
  let playerCount = 0
  let maxPlayers = 12
  let serverName = 'Palworld'
  let lastError: string | null = null

  try {
    const config = loadConfig()
    if (typeof config.values.ServerPlayerMaxNum === 'number') {
      maxPlayers = config.values.ServerPlayerMaxNum
    }
    if (typeof config.values.ServerName === 'string') {
      serverName = config.values.ServerName
    }
  } catch {
    // ignore
  }

  if (settings.hasRconPassword && (processStats.running || settings.useSimulator)) {
    try {
      if (!rconService.isConnected()) {
        await rconService.connect()
      }
      rconConnected = rconService.isConnected()
      if (rconConnected) {
        const players = await rconService.showPlayers()
        playerCount = players.length
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err)
      rconConnected = false
    }
  }

  let onlineStatus: ServerStatus['onlineStatus'] = 'offline'
  if (processStats.running && rconConnected) onlineStatus = 'online'
  else if (processStats.running) onlineStatus = 'online'
  else onlineStatus = 'offline'

  return {
    process: processStats,
    rconConnected,
    onlineStatus,
    playerCount,
    maxPlayers,
    serverName,
    lastError: lastError ?? rconService.getLastError(),
    lastUpdatedAt: new Date().toISOString()
  }
}

function registerIpc(): void {
  ipcMain.handle(IPC.getSettings, () => getSettings())
  ipcMain.handle(IPC.saveSettings, (_e, update: AppSettingsUpdate) => {
    const saved = saveSettings(update)
    backupScheduler.restart()
    logWatcher.restart()
    void rconService.disconnect()
    return saved
  })

  ipcMain.handle(IPC.getStatus, async () => buildStatus())
  ipcMain.handle(IPC.startServer, async (): Promise<ActionResult> => {
    const result = await processManager.start()
    sendToast({
      type: result.ok ? 'success' : 'error',
      title: 'Démarrage',
      message: result.message
    })
    return result
  })
  ipcMain.handle(IPC.stopServer, async (): Promise<ActionResult> => {
    await rconService.disconnect()
    const result = await processManager.stop()
    sendToast({
      type: result.ok ? 'success' : 'error',
      title: 'Arrêt',
      message: result.message
    })
    return result
  })
  ipcMain.handle(IPC.restartServer, async (): Promise<ActionResult> => {
    await rconService.disconnect()
    const result = await processManager.restart()
    sendToast({
      type: result.ok ? 'success' : 'error',
      title: 'Redémarrage',
      message: result.message
    })
    return result
  })
  ipcMain.handle(IPC.saveWorld, async (): Promise<ActionResult> => {
    try {
      const response = await rconService.save()
      return { ok: true, message: 'Sauvegarde monde demandée.', details: response }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return { ok: false, message }
    }
  })

  ipcMain.handle(IPC.getPlayers, async () => {
    try {
      return await rconService.showPlayers()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      throw new Error(message)
    }
  })
  ipcMain.handle(IPC.kickPlayer, async (_e, steamId: string): Promise<ActionResult> => {
    try {
      const details = await rconService.kick(steamId)
      return { ok: true, message: `Joueur kick : ${steamId}`, details }
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : String(err) }
    }
  })
  ipcMain.handle(IPC.banPlayer, async (_e, steamId: string): Promise<ActionResult> => {
    try {
      const details = await rconService.ban(steamId)
      addBan(steamId)
      return { ok: true, message: `Joueur ban : ${steamId}`, details }
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : String(err) }
    }
  })
  ipcMain.handle(IPC.getWhitelist, () => getWhitelist())
  ipcMain.handle(IPC.setWhitelist, (_e, entries: string[]) => setWhitelist(entries))
  ipcMain.handle(IPC.getBanList, () => getBanList())
  ipcMain.handle(IPC.unbanPlayer, (_e, steamId: string) => removeBan(steamId))

  ipcMain.handle(IPC.getConfig, () => loadConfig())
  ipcMain.handle(IPC.saveConfig, (_e, values: ConfigValues) => saveConfig(values))
  ipcMain.handle(IPC.getConfigSchema, () => getConfigSchema())

  ipcMain.handle(IPC.listBackups, () => listBackups())
  ipcMain.handle(IPC.createBackup, async () => createBackup('manual'))
  ipcMain.handle(IPC.restoreBackup, (_e, id: string) => {
    restoreBackup(id)
    return { ok: true, message: `Backup restauré : ${id}` } satisfies ActionResult
  })
  ipcMain.handle(IPC.deleteBackup, (_e, id: string) => {
    deleteBackup(id)
    return { ok: true, message: `Backup supprimé : ${id}` } satisfies ActionResult
  })

  ipcMain.handle(IPC.getLogs, () => logWatcher.getLines())
  ipcMain.handle(IPC.broadcast, async (_e, message: string): Promise<ActionResult> => {
    try {
      if (!message.trim()) return { ok: false, message: 'Message vide.' }
      const details = await rconService.broadcast(message.trim())
      return { ok: true, message: 'Annonce envoyée.', details }
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : String(err) }
    }
  })

  ipcMain.handle(IPC.listMods, () => listMods())
  ipcMain.handle(IPC.setModEnabled, (_e, id: string, enabled: boolean) =>
    setModEnabled(id, enabled)
  )

  ipcMain.handle(IPC.pickDirectory, async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  ipcMain.handle(IPC.openPath, async (_e, target: string) => shell.openPath(target))
  ipcMain.handle(IPC.getAppLogPath, () => appLogger.path())
}

function startStatusLoop(): void {
  if (statusTimer) clearInterval(statusTimer)
  statusTimer = setInterval(() => {
    void (async () => {
      try {
        const status = await buildStatus()
        mainWindow?.webContents.send(IPC.statusUpdated, status)
      } catch (err) {
        appLogger.warn('Status loop error', err)
      }
    })()
  }, 3000)
}

app.whenReady().then(() => {
  appLogger.info('App starting', { version: app.getVersion(), platform: process.platform })

  // Optional seed for UI capture / automated demos (never used in normal runs)
  if (process.env.PSM_SEED_JSON) {
    try {
      const seed = JSON.parse(process.env.PSM_SEED_JSON) as Record<string, unknown>
      saveSettings(seed)
      appLogger.info('Applied PSM_SEED_JSON settings for capture/demo')
    } catch (err) {
      appLogger.error('Invalid PSM_SEED_JSON', err)
    }
  }

  registerIpc()
  createWindow()
  logWatcher.start()
  backupScheduler.start()
  startStatusLoop()

  // Dev convenience: seed simulator defaults if empty
  const settings = getSettings()
  if (!settings.serverPath && !getRconPassword()) {
    appLogger.info('No settings yet — user must configure server path and RCON')
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  if (statusTimer) clearInterval(statusTimer)
  logWatcher.stop()
  backupScheduler.stop()
  void rconService.disconnect()
  appLogger.info('App quitting')
})

process.on('uncaughtException', (err) => {
  appLogger.error('Uncaught exception', err)
})
process.on('unhandledRejection', (err) => {
  appLogger.error('Unhandled rejection', err)
})
