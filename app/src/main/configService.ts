import fs from 'fs'
import path from 'path'
import { CONFIG_SCHEMA, DEFAULT_CONFIG_VALUES } from '../shared/configSchema'
import { parseOptionSettings, serializeConfig } from '../shared/iniCodec'
import type { ConfigState, ConfigValues } from '../shared/types'
import { appLogger } from './logger'
import { getSettings } from './settingsStore'

export { parseOptionSettings, serializeConfig } from '../shared/iniCodec'

export function resolveConfigPath(serverPath?: string): string {
  const root = serverPath ?? getSettings().serverPath
  const windowsServer = path.join(
    root,
    'Pal',
    'Saved',
    'Config',
    'WindowsServer',
    'PalWorldSettings.ini'
  )
  if (fs.existsSync(windowsServer)) return windowsServer

  const linuxServer = path.join(
    root,
    'Pal',
    'Saved',
    'Config',
    'LinuxServer',
    'PalWorldSettings.ini'
  )
  if (fs.existsSync(linuxServer)) return linuxServer

  const flat = path.join(root, 'PalWorldSettings.ini')
  if (fs.existsSync(flat)) return flat

  return windowsServer
}

export function resolveEngineIniPath(serverPath?: string): string {
  const root = serverPath ?? getSettings().serverPath
  const win = path.join(root, 'Pal', 'Saved', 'Config', 'WindowsServer', 'Engine.ini')
  if (fs.existsSync(win)) return win
  const linux = path.join(root, 'Pal', 'Saved', 'Config', 'LinuxServer', 'Engine.ini')
  if (fs.existsSync(linux)) return linux
  return win
}

export function loadConfig(): ConfigState {
  const warnings: string[] = []
  const settings = getSettings()
  if (!settings.serverPath) {
    return {
      path: '',
      exists: false,
      values: { ...DEFAULT_CONFIG_VALUES },
      rawSnippet: '',
      lastLoadedAt: new Date().toISOString(),
      warnings: ['Chemin du serveur non configuré.']
    }
  }

  const configPath = resolveConfigPath()
  if (!fs.existsSync(configPath)) {
    warnings.push(`Fichier introuvable : ${configPath}. Les valeurs par défaut sont affichées.`)
    appLogger.warn('Config file missing', { configPath })
    return {
      path: configPath,
      exists: false,
      values: { ...DEFAULT_CONFIG_VALUES },
      rawSnippet: '',
      lastLoadedAt: new Date().toISOString(),
      warnings
    }
  }

  try {
    const raw = fs.readFileSync(configPath, 'utf8')
    if (!raw.includes('OptionSettings=')) {
      warnings.push(
        'Fichier config présent mais OptionSettings introuvable — fichier potentiellement corrompu.'
      )
    }
    const values = parseOptionSettings(raw)
    return {
      path: configPath,
      exists: true,
      values,
      rawSnippet: raw.slice(0, 500),
      lastLoadedAt: new Date().toISOString(),
      warnings
    }
  } catch (err) {
    appLogger.error('Failed to load config', err)
    warnings.push(`Erreur de lecture : ${err instanceof Error ? err.message : String(err)}`)
    return {
      path: configPath,
      exists: true,
      values: { ...DEFAULT_CONFIG_VALUES },
      rawSnippet: '',
      lastLoadedAt: new Date().toISOString(),
      warnings
    }
  }
}

export function saveConfig(values: ConfigValues): ConfigState {
  const settings = getSettings()
  if (!settings.serverPath) {
    throw new Error('Chemin du serveur non configuré.')
  }
  const configPath = resolveConfigPath()
  const dir = path.dirname(configPath)
  fs.mkdirSync(dir, { recursive: true })

  if (fs.existsSync(configPath)) {
    const bak = `${configPath}.bak`
    fs.copyFileSync(configPath, bak)
  }

  const content = serializeConfig(values)
  fs.writeFileSync(configPath, content, 'utf8')
  appLogger.info('Config saved', { configPath })
  return loadConfig()
}

export function getConfigSchema() {
  return CONFIG_SCHEMA
}
