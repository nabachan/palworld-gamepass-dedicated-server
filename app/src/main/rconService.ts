import { Rcon } from 'rcon-client'
import { appLogger } from './logger'
import { getRconPassword, getSettings } from './settingsStore'
import type { PlayerInfo } from '../shared/types'
import { parseShowPlayers } from '../shared/parsePlayers'

export { parseShowPlayers }

export class RconService {
  private client: Rcon | null = null
  private connecting: Promise<Rcon> | null = null
  private lastError: string | null = null

  getLastError(): string | null {
    return this.lastError
  }

  isConnected(): boolean {
    return this.client !== null
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        this.client.end()
      } catch (err) {
        appLogger.warn('RCON disconnect error', err)
      }
      this.client = null
    }
  }

  async connect(force = false): Promise<Rcon> {
    if (this.client && !force) return this.client
    if (this.connecting) return this.connecting

    this.connecting = (async () => {
      await this.disconnect()
      const settings = getSettings()
      const password = getRconPassword()

      if (!password) {
        throw new Error('Mot de passe RCON non configuré. Ouvrez Paramètres pour le saisir.')
      }

      appLogger.info('Connecting RCON', {
        host: settings.rconHost,
        port: settings.rconPort
      })

      const client = await Rcon.connect({
        host: settings.rconHost,
        port: settings.rconPort,
        password,
        timeout: 5000
      })

      client.on('end', () => {
        appLogger.warn('RCON connection ended')
        this.client = null
      })
      client.on('error', (err) => {
        appLogger.error('RCON socket error', err)
        this.lastError = err.message
        this.client = null
      })

      this.client = client
      this.lastError = null
      appLogger.info('RCON connected')
      return client
    })()

    try {
      return await this.connecting
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      this.lastError = message
      appLogger.error('RCON connect failed', err)
      throw new Error(humanizeRconError(message))
    } finally {
      this.connecting = null
    }
  }

  async send(command: string): Promise<string> {
    const client = await this.connect()
    appLogger.debug('RCON send', { command })
    try {
      const response = await client.send(command)
      return response ?? ''
    } catch (err) {
      this.client = null
      const message = err instanceof Error ? err.message : String(err)
      this.lastError = message
      appLogger.error('RCON command failed', { command, err })
      throw new Error(humanizeRconError(message))
    }
  }

  async showPlayers(): Promise<PlayerInfo[]> {
    const raw = await this.send('ShowPlayers')
    return parseShowPlayers(raw)
  }

  async broadcast(message: string): Promise<string> {
    // Palworld Broadcast expects the message without extra quotes usually
    return this.send(`Broadcast ${message}`)
  }

  async save(): Promise<string> {
    return this.send('Save')
  }

  async kick(steamId: string): Promise<string> {
    return this.send(`KickPlayer ${steamId}`)
  }

  async ban(steamId: string): Promise<string> {
    return this.send(`BanPlayer ${steamId}`)
  }

  async info(): Promise<string> {
    return this.send('Info')
  }
}

function humanizeRconError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('econnrefused') || lower.includes('connect')) {
    return 'Impossible de se connecter au RCON. Vérifiez que le serveur est démarré, que RCON est activé, et que le port est correct.'
  }
  if (lower.includes('auth') || lower.includes('password') || lower.includes('authentication')) {
    return 'Authentification RCON échouée. Vérifiez le mot de passe AdminPassword / RCON.'
  }
  if (lower.includes('timeout') || lower.includes('timed out')) {
    return 'Délai d’attente RCON dépassé. Le serveur ne répond pas.'
  }
  return `Erreur RCON : ${message}`
}

export const rconService = new RconService()
