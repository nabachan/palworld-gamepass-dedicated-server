/**
 * Headless integration smoke test for file services (no Electron UI).
 * Speaks RCON to the JS mock and exercises config/backups/mods/logs.
 */
import fs from 'fs'
import path from 'path'
import { spawn, type ChildProcess } from 'child_process'
import { Rcon } from 'rcon-client'
import { parseOptionSettings, serializeConfig } from '../src/shared/iniCodec'
import { parseShowPlayers } from '../src/shared/parsePlayers'

const ROOT = path.join(process.cwd(), 'simulator-data-smoke')
const PORT = 29000 + Math.floor(Math.random() * 500)
const PASSWORD = 'smoke-admin'
const MOCK = path.join(process.cwd(), 'resources', 'mock-palworld-server.js')

async function waitReady(timeoutMs = 10000): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const c = await Rcon.connect({ host: '127.0.0.1', port: PORT, password: PASSWORD, timeout: 500 })
      await c.end()
      return
    } catch {
      await new Promise((r) => setTimeout(r, 150))
    }
  }
  throw new Error('mock not ready')
}

async function main(): Promise<void> {
  fs.rmSync(ROOT, { recursive: true, force: true })
  const child: ChildProcess = spawn(
    process.execPath,
    [MOCK, '--data', ROOT, '--rcon-port', String(PORT)],
    {
      env: { ...process.env, PALWORLD_SIM_RCON_PASSWORD: PASSWORD },
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true
    }
  )

  const assert = (name: string, ok: boolean): void => {
    if (!ok) throw new Error(`FAIL ${name}`)
    console.log(`PASS ${name}`)
  }

  try {
    await waitReady()
    const rcon = await Rcon.connect({ host: '127.0.0.1', port: PORT, password: PASSWORD, timeout: 2000 })
    const players = parseShowPlayers(await rcon.send('ShowPlayers'))
    assert('players', players.length >= 2)
    assert('broadcast', (await rcon.send('Broadcast smoke')).toLowerCase().includes('broadcast'))
    assert('save', (await rcon.send('Save')).toLowerCase().includes('save'))
    await rcon.end()

    const configPath = path.join(ROOT, 'Pal', 'Saved', 'Config', 'WindowsServer', 'PalWorldSettings.ini')
    assert('config exists', fs.existsSync(configPath))
    const values = parseOptionSettings(fs.readFileSync(configPath, 'utf8'))
    values.ServerName = 'Smoke'
    fs.writeFileSync(configPath, serializeConfig(values))
    assert('config write', parseOptionSettings(fs.readFileSync(configPath, 'utf8')).ServerName === 'Smoke')

    const mods = fs.readdirSync(path.join(ROOT, 'Pal', 'Content', 'Paks', '~mods'))
    assert('mods', mods.some((m) => m.includes('.pak')))
    assert('logs', fs.readFileSync(path.join(ROOT, 'Pal', 'Saved', 'Logs', 'Pal.log'), 'utf8').includes('Broadcast'))

    // backup simulation
    const bak = path.join(ROOT, 'PSM_Backups', 'manual', 'SaveGames')
    fs.cpSync(path.join(ROOT, 'Pal', 'Saved', 'SaveGames'), bak, { recursive: true })
    assert('backup', fs.existsSync(path.join(bak, '0', 'Level.sav')))

    console.log('SMOKE OK')
  } catch (err) {
    console.error(err)
    process.exitCode = 1
  } finally {
    if (child.pid) {
      try {
        process.kill(-child.pid, 'SIGKILL')
      } catch {
        child.kill('SIGKILL')
      }
    }
    process.exit(process.exitCode ?? 0)
  }
}

void main()
