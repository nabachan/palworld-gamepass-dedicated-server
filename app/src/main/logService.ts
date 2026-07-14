import fs from 'fs'
import path from 'path'
import { watch, type FSWatcher } from 'chokidar'
import { BrowserWindow } from 'electron'
import { appLogger } from './logger'
import { getSettings } from './settingsStore'
import type { LogLine } from '../shared/types'
import { IPC } from '../shared/types'

const MAX_LINES = 2000

function findLogCandidates(serverPath: string): string[] {
  return [
    path.join(serverPath, 'Pal', 'Saved', 'Logs', 'Pal.log'),
    path.join(serverPath, 'Pal', 'Binaries', 'Win64', 'Pal', 'Saved', 'Logs', 'Pal.log'),
    path.join(serverPath, 'logs', 'server.log'),
    path.join(serverPath, 'server.log'),
    path.join(serverPath, 'PalServer.log')
  ]
}

export function resolveLogPath(): string | null {
  const settings = getSettings()
  if (!settings.serverPath) return null
  for (const c of findLogCandidates(settings.serverPath)) {
    if (fs.existsSync(c)) return c
  }
  // Return preferred path even if missing so we can watch for creation
  return findLogCandidates(settings.serverPath)[0] ?? null
}

function parseLevel(line: string): LogLine['level'] {
  if (/\berror\b/i.test(line) || /\[error\]/i.test(line)) return 'error'
  if (/\bwarn(ing)?\b/i.test(line) || /\[warn\]/i.test(line)) return 'warn'
  if (/\bdebug\b/i.test(line)) return 'debug'
  if (/\binfo\b/i.test(line)) return 'info'
  return 'unknown'
}

function toLogLine(raw: string, index: number): LogLine {
  return {
    id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    level: parseLevel(raw),
    message: raw,
    raw
  }
}

export class LogWatcher {
  private watcher: FSWatcher | null = null
  private lines: LogLine[] = []
  private offset = 0
  private currentPath: string | null = null
  private pollTimer: NodeJS.Timeout | null = null

  getLines(): LogLine[] {
    return this.lines
  }

  restart(): void {
    this.stop()
    this.start()
  }

  start(): void {
    const logPath = resolveLogPath()
    this.currentPath = logPath
    if (!logPath) {
      appLogger.warn('No log path available (server path not set)')
      return
    }

    const dir = path.dirname(logPath)
    fs.mkdirSync(dir, { recursive: true })

    if (fs.existsSync(logPath)) {
      this.ingestFile(logPath, true)
    }

    this.watcher = watch(logPath, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 100 },
      usePolling: true,
      interval: 500
    })

    this.watcher.on('add', () => this.ingestFile(logPath, true))
    this.watcher.on('change', () => this.ingestFile(logPath, false))
    this.watcher.on('error', (err) => appLogger.error('Log watcher error', err))

    // Fallback polling for environments where fs events are flaky
    this.pollTimer = setInterval(() => {
      if (this.currentPath && fs.existsSync(this.currentPath)) {
        this.ingestFile(this.currentPath, false)
      }
    }, 2000)

    appLogger.info('Log watcher started', { logPath })
  }

  stop(): void {
    if (this.watcher) {
      void this.watcher.close()
      this.watcher = null
    }
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
  }

  private ingestFile(filePath: string, full: boolean): void {
    try {
      const stat = fs.statSync(filePath)
      if (full || stat.size < this.offset) {
        this.offset = 0
        if (full) this.lines = []
      }
      if (stat.size === this.offset) return

      const fd = fs.openSync(filePath, 'r')
      const length = stat.size - this.offset
      const buffer = Buffer.alloc(length)
      fs.readSync(fd, buffer, 0, length, this.offset)
      fs.closeSync(fd)
      this.offset = stat.size

      const text = buffer.toString('utf8')
      const newLines = text.split(/\r?\n/).filter((l) => l.length > 0)
      const mapped = newLines.map((l, i) => toLogLine(l, i))
      this.lines = [...this.lines, ...mapped].slice(-MAX_LINES)
      this.broadcast()
    } catch (err) {
      appLogger.warn('Failed to read log file', err)
    }
  }

  private broadcast(): void {
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send(IPC.logsUpdated, this.lines.slice(-200))
    }
  }
}

export const logWatcher = new LogWatcher()
