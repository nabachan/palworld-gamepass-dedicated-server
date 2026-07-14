import { CONFIG_SCHEMA, DEFAULT_CONFIG_VALUES } from '../shared/configSchema'
import type { ConfigValues } from '../shared/types'

export function parseOptionSettings(content: string): ConfigValues {
  const values: ConfigValues = { ...DEFAULT_CONFIG_VALUES }
  const match = content.match(/OptionSettings=\(([\s\S]*?)\)\s*$/m)
  if (!match) {
    const alt = content.match(/OptionSettings=\(([\s\S]*?)\)/)
    if (!alt) return values
    return parseKeyValues(alt[1], values)
  }
  return parseKeyValues(match[1], values)
}

function parseKeyValues(body: string, base: ConfigValues): ConfigValues {
  const values = { ...base }
  const parts = splitOptions(body)
  for (const part of parts) {
    const eq = part.indexOf('=')
    if (eq < 0) continue
    const key = part.slice(0, eq).trim()
    const rawVal = part.slice(eq + 1).trim()
    if (!key) continue
    values[key] = coerceValue(key, rawVal)
  }
  return values
}

function splitOptions(body: string): string[] {
  const parts: string[] = []
  let current = ''
  let depth = 0
  let inQuotes = false
  for (let i = 0; i < body.length; i++) {
    const ch = body[i]
    if (ch === '"' && body[i - 1] !== '\\') {
      inQuotes = !inQuotes
      current += ch
      continue
    }
    if (!inQuotes) {
      if (ch === '(') depth++
      if (ch === ')') depth--
      if (ch === ',' && depth === 0) {
        parts.push(current.trim())
        current = ''
        continue
      }
    }
    current += ch
  }
  if (current.trim()) parts.push(current.trim())
  return parts
}

function coerceValue(key: string, raw: string): string | number | boolean {
  const meta = CONFIG_SCHEMA.find((f) => f.key === key)
  let v = raw
  if (v.startsWith('"') && v.endsWith('"')) {
    v = v.slice(1, -1)
  }

  if (meta?.type === 'boolean' || v === 'True' || v === 'False') {
    return v === 'True' || v === 'true'
  }
  if (meta?.type === 'number' || /^-?\d+(\.\d+)?$/.test(v)) {
    const n = Number(v)
    return Number.isFinite(n) ? n : v
  }
  return v
}

function formatValue(key: string, value: string | number | boolean): string {
  const meta = CONFIG_SCHEMA.find((f) => f.key === key)
  if (typeof value === 'boolean' || meta?.type === 'boolean') {
    return value ? 'True' : 'False'
  }
  if (typeof value === 'number' || meta?.type === 'number') {
    const n = Number(value)
    if (!Number.isFinite(n)) return String(value)
    if (Number.isInteger(n)) return String(n)
    return n.toFixed(6)
  }
  const str = String(value)
  if (
    key === 'CrossplayPlatforms' ||
    key === 'DeathPenalty' ||
    key === 'Difficulty' ||
    key === 'RandomizerType' ||
    key === 'LogFormatType'
  ) {
    return str
  }
  return `"${str.replace(/"/g, '\\"')}"`
}

const SECTION = '[/Script/Pal.PalGameWorldSettings]'

export function serializeConfig(values: ConfigValues): string {
  const keys = Object.keys(values)
  const ordered = [
    ...CONFIG_SCHEMA.map((f) => f.key).filter((k) => k in values),
    ...keys.filter((k) => !CONFIG_SCHEMA.some((f) => f.key === k))
  ]
  const unique = [...new Set(ordered)]
  const body = unique.map((k) => `${k}=${formatValue(k, values[k])}`).join(',')
  return `${SECTION}\nOptionSettings=(${body})\n`
}
