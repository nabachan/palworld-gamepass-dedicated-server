import { spawn, type ChildProcess } from 'child_process'
import fs from 'fs'
import path from 'path'
import si from 'systeminformation'
import { appLogger } from './logger'
import { getRconPassword, getSettings } from './settingsStore'
import type { ServerProcessStats } from '../shared/types'

interface ManagedProcess {
  child: ChildProcess
  pid: number
  startedAt: Date
  /** For simulator node process */
  isSimulator: boolean
}

class ProcessManager {
  private managed: ManagedProcess | null = null
  private externalPid: number | null = null
  private externalStartedAt: Date | null = null

  getStatsSync(): Omit<ServerProcessStats, 'cpuPercent' | 'memoryMb'> {
    if (this.managed && !this.managed.child.killed) {
      return {
        running: true,
        pid: this.managed.pid,
        uptimeSeconds: Math.floor((Date.now() - this.managed.startedAt.getTime()) / 1000),
        startedAt: this.managed.startedAt.toISOString()
      }
    }
    if (this.externalPid) {
      return {
        running: true,
        pid: this.externalPid,
        uptimeSeconds: this.externalStartedAt
          ? Math.floor((Date.now() - this.externalStartedAt.getTime()) / 1000)
          : 0,
        startedAt: this.externalStartedAt?.toISOString() ?? null
      }
    }
    return {
      running: false,
      pid: null,
      uptimeSeconds: 0,
      startedAt: null
    }
  }

  async getStats(): Promise<ServerProcessStats> {
    await this.refreshExternalProcess()
    const base = this.getStatsSync()
    if (!base.running || !base.pid) {
      return { ...base, cpuPercent: 0, memoryMb: 0 }
    }
    try {
      const processes = await si.processes()
      const proc = processes.list.find((p) => p.pid === base.pid)
      if (!proc) {
        return { ...base, cpuPercent: 0, memoryMb: 0 }
      }
      return {
        ...base,
        cpuPercent: Number(proc.cpu ?? 0),
        memoryMb: Math.round(Number(proc.memRss ?? 0) / 1024)
      }
    } catch (err) {
      appLogger.warn('Failed to read process stats', err)
      return { ...base, cpuPercent: 0, memoryMb: 0 }
    }
  }

  async refreshExternalProcess(): Promise<void> {
    if (this.managed && !this.managed.child.killed) return

    const settings = getSettings()
    try {
      const processes = await si.processes()
      const match = processes.list.find((p) => {
        const name = (p.name || '').toLowerCase()
        const cmd = (p.command || '').toLowerCase()
        if (settings.useSimulator) {
          return cmd.includes('mock-palworld-server') || name.includes('mock-palworld')
        }
        return (
          name.includes('palserver') ||
          cmd.includes('palserver-win64-shipping') ||
          cmd.includes('palserver.exe')
        )
      })
      if (match) {
        if (this.externalPid !== match.pid) {
          this.externalPid = match.pid
          this.externalStartedAt = new Date()
          appLogger.info('Detected external Palworld process', { pid: match.pid })
        }
      } else {
        this.externalPid = null
        this.externalStartedAt = null
      }
    } catch (err) {
      appLogger.warn('Process scan failed', err)
    }
  }

  resolveExecutable(): string {
    const settings = getSettings()
    if (settings.useSimulator) {
      // Relayed via node scripts — resolved at start time
      return 'simulator'
    }
    const root = settings.serverPath
    const candidates = [
      path.join(root, 'PalServer.exe'),
      path.join(root, 'Pal', 'Binaries', 'Win64', 'PalServer-Win64-Shipping-Cmd.exe'),
      path.join(root, 'Pal', 'Binaries', 'Win64', 'PalServer-Win64-Shipping.exe'),
      path.join(root, 'PalServer.sh')
    ]
    for (const c of candidates) {
      if (fs.existsSync(c)) return c
    }
    throw new Error(
      `Exécutable PalServer introuvable dans « ${root} ». Vérifiez le chemin d’installation.`
    )
  }

  async start(): Promise<{ ok: boolean; message: string }> {
    await this.refreshExternalProcess()
    const current = this.getStatsSync()
    if (current.running) {
      return { ok: true, message: `Le serveur tourne déjà (PID ${current.pid}).` }
    }

    const settings = getSettings()
    if (!settings.serverPath && !settings.useSimulator) {
      return { ok: false, message: 'Configurez d’abord le chemin du serveur dans Paramètres.' }
    }

    try {
      if (settings.useSimulator) {
        return await this.startSimulator()
      }
      return await this.startRealServer()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      appLogger.error('Failed to start server', err)
      return { ok: false, message }
    }
  }

  private async startSimulator(): Promise<{ ok: boolean; message: string }> {
    const { app } = await import('electron')
    const settings = getSettings()
    const dataDir = settings.serverPath || path.join(app.getPath('userData'), 'simulator-data')
    fs.mkdirSync(dataDir, { recursive: true })

    const packagedMock = path.join(process.resourcesPath || '', 'resources', 'mock-palworld-server.js')
    const devMockJs = path.join(app.getAppPath(), 'resources', 'mock-palworld-server.js')
    const cwdMockJs = path.join(process.cwd(), 'resources', 'mock-palworld-server.js')
    const mockScript = [packagedMock, devMockJs, cwdMockJs].find((p) => fs.existsSync(p))
    if (!mockScript) {
      throw new Error('Simulateur introuvable (resources/mock-palworld-server.js).')
    }

    const password = getRconPassword() || 'admin'
    const env = {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      PALWORLD_SIM_DATA: dataDir,
      PALWORLD_SIM_RCON_PORT: String(settings.rconPort),
      PALWORLD_SIM_RCON_PASSWORD: password
    }

    const child = spawn(
      process.execPath,
      [mockScript, '--data', dataDir, '--rcon-port', String(settings.rconPort)],
      {
        env,
        stdio: 'pipe',
        windowsHide: true
      }
    )

    this.attachChild(child, true)
    appLogger.info('Simulator started', { pid: child.pid, dataDir, mockScript })
    return { ok: true, message: `Simulateur démarré (PID ${child.pid}).` }
  }

  private async startRealServer(): Promise<{ ok: boolean; message: string }> {
    const settings = getSettings()
    const exe = this.resolveExecutable()
    const args = settings.launchArgs.split(/\s+/).filter(Boolean)
    const cwd = settings.serverPath

    appLogger.info('Starting PalServer', { exe, args, cwd })
    const child = spawn(exe, args, {
      cwd,
      detached: true,
      stdio: 'ignore',
      windowsHide: false,
      shell: process.platform === 'win32' && exe.endsWith('.bat')
    })
    child.unref()
    this.attachChild(child, false)
    return { ok: true, message: `Serveur démarré (PID ${child.pid}).` }
  }

  private attachChild(child: ChildProcess, isSimulator: boolean): void {
    if (!child.pid) {
      throw new Error('Impossible de démarrer le processus (pas de PID).')
    }
    this.managed = {
      child,
      pid: child.pid,
      startedAt: new Date(),
      isSimulator
    }
    child.on('exit', (code, signal) => {
      appLogger.info('Server process exited', { code, signal, pid: child.pid })
      if (this.managed?.pid === child.pid) {
        this.managed = null
      }
    })
    child.on('error', (err) => {
      appLogger.error('Server process error', err)
    })
    child.stdout?.on('data', (d) => appLogger.debug('server stdout', d.toString()))
    child.stderr?.on('data', (d) => appLogger.warn('server stderr', d.toString()))
  }

  async stop(): Promise<{ ok: boolean; message: string }> {
    await this.refreshExternalProcess()
    const stats = this.getStatsSync()
    if (!stats.running || !stats.pid) {
      return { ok: true, message: 'Le serveur est déjà arrêté.' }
    }

    try {
      if (this.managed && this.managed.pid === stats.pid) {
        await killProcessTree(this.managed.pid)
        this.managed = null
      } else {
        await killProcessTree(stats.pid)
        this.externalPid = null
        this.externalStartedAt = null
      }
      appLogger.info('Server stopped', { pid: stats.pid })
      return { ok: true, message: `Serveur arrêté (PID ${stats.pid}).` }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      appLogger.error('Failed to stop server', err)
      return { ok: false, message: `Échec de l’arrêt : ${message}` }
    }
  }

  async restart(): Promise<{ ok: boolean; message: string }> {
    const stop = await this.stop()
    if (!stop.ok) return stop
    await delay(1500)
    return this.start()
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function killProcessTree(pid: number): Promise<void> {
  if (process.platform === 'win32') {
    await new Promise<void>((resolve, reject) => {
      const killer = spawn('taskkill', ['/PID', String(pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true
      })
      killer.on('exit', (code) => {
        if (code === 0 || code === 128) resolve()
        else reject(new Error(`taskkill exit ${code}`))
      })
      killer.on('error', reject)
    })
    return
  }
  try {
    process.kill(pid, 'SIGTERM')
  } catch {
    // already dead
  }
  await delay(800)
  try {
    process.kill(pid, 0)
    process.kill(pid, 'SIGKILL')
  } catch {
    // gone
  }
}

export const processManager = new ProcessManager()
