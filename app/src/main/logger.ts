import { app } from 'electron'
import fs from 'fs'
import path from 'path'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function getLogDir(): string {
  const dir = path.join(app.getPath('userData'), 'logs')
  ensureDir(dir)
  return dir
}

function getLogFile(): string {
  return path.join(getLogDir(), 'app.log')
}

function formatLine(level: LogLevel, message: string, meta?: unknown): string {
  const ts = new Date().toISOString()
  const extra = meta === undefined ? '' : ` ${safeSerialize(meta)}`
  return `[${ts}] [${level.toUpperCase()}] ${message}${extra}\n`
}

function safeSerialize(value: unknown): string {
  try {
    if (value instanceof Error) {
      return JSON.stringify({ name: value.name, message: value.message, stack: value.stack })
    }
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

export const appLogger = {
  path(): string {
    return getLogFile()
  },

  write(level: LogLevel, message: string, meta?: unknown): void {
    try {
      const line = formatLine(level, message, meta)
      fs.appendFileSync(getLogFile(), line, 'utf8')
      const consoleFn =
        level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
      consoleFn(`[${level}] ${message}`, meta ?? '')
    } catch (err) {
      console.error('Failed to write app log', err)
    }
  },

  debug(message: string, meta?: unknown): void {
    this.write('debug', message, meta)
  },
  info(message: string, meta?: unknown): void {
    this.write('info', message, meta)
  },
  warn(message: string, meta?: unknown): void {
    this.write('warn', message, meta)
  },
  error(message: string, meta?: unknown): void {
    this.write('error', message, meta)
  }
}
