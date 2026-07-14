/**
 * End-to-end headless test against the mock Palworld server.
 * Does not require Electron UI — validates core services.
 */
import fs from 'fs'
import path from 'path'
import { spawn, type ChildProcess } from 'child_process'
import { Rcon } from 'rcon-client'
import { parseOptionSettings, serializeConfig } from '../src/shared/iniCodec'
import { parseShowPlayers } from '../src/shared/parsePlayers'

const ROOT = path.join(process.cwd(), 'simulator-data-e2e')
const PORT = 28000 + Math.floor(Math.random() * 1000)
const PASSWORD = 'admin'

async function waitForReady(proc: ChildProcess, timeoutMs = 15000): Promise<void> {
  const start = Date.now()
  let output = ''
  const onData = (d: Buffer): void => {
    output += d.toString()
  }
  proc.stdout?.on('data', onData)
  proc.stderr?.on('data', onData)

  while (Date.now() - start < timeoutMs) {
    if (output.includes('RCON on') || output.includes('listening')) {
      // also require config layout
      const configPath = path.join(
        ROOT,
        'Pal',
        'Saved',
        'Config',
        'WindowsServer',
        'PalWorldSettings.ini'
      )
      if (fs.existsSync(configPath)) return
    }
    // Fallback: try connect once layout exists
    const configPath = path.join(
      ROOT,
      'Pal',
      'Saved',
      'Config',
      'WindowsServer',
      'PalWorldSettings.ini'
    )
    if (fs.existsSync(configPath)) {
      try {
        const rcon = await Rcon.connect({
          host: '127.0.0.1',
          port: PORT,
          password: PASSWORD,
          timeout: 800
        })
        await rcon.end()
        return
      } catch {
        // retry
      }
    }
    await new Promise((r) => setTimeout(r, 200))
  }
  throw new Error(`Simulator not ready.\nOutput:\n${output}`)
}

async function main(): Promise<void> {
  fs.rmSync(ROOT, { recursive: true, force: true })
  fs.mkdirSync(ROOT, { recursive: true })

  const sim: ChildProcess = spawn(
    'npx',
    ['tsx', 'scripts/mock-palworld-server.ts', '--data', ROOT, '--rcon-port', String(PORT)],
    {
      cwd: process.cwd(),
      env: { ...process.env, PALWORLD_SIM_RCON_PASSWORD: PASSWORD },
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true
    }
  )

  let simLog = ''
  sim.stdout?.on('data', (d) => {
    simLog += d.toString()
    process.stdout.write(d)
  })
  sim.stderr?.on('data', (d) => {
    simLog += d.toString()
    process.stderr.write(d)
  })

  const results: string[] = []
  const assert = (name: string, cond: boolean, detail = ''): void => {
    if (!cond) throw new Error(`FAIL: ${name} ${detail}`)
    results.push(`PASS: ${name}`)
    console.log(`PASS: ${name}`)
  }

  try {
    await waitForReady(sim)

    // RCON ShowPlayers
    {
      const rcon = await Rcon.connect({
        host: '127.0.0.1',
        port: PORT,
        password: PASSWORD,
        timeout: 3000
      })
      const playersRaw = await rcon.send('ShowPlayers')
      const players = parseShowPlayers(playersRaw)
      assert('ShowPlayers returns players', players.length >= 2, playersRaw)

      const broadcast = await rcon.send('Broadcast Hello from e2e')
      assert('Broadcast works', broadcast.toLowerCase().includes('broadcast'), broadcast)

      const save = await rcon.send('Save')
      assert('Save works', save.toLowerCase().includes('save'), save)

      const kick = await rcon.send('KickPlayer 76561198000000001')
      assert('Kick works', kick.toLowerCase().includes('kick'), kick)

      await rcon.end()
    }

    // Bad password
    {
      let failed = false
      try {
        await Rcon.connect({
          host: '127.0.0.1',
          port: PORT,
          password: 'wrong',
          timeout: 2000
        })
      } catch {
        failed = true
      }
      assert('Rejects bad RCON password', failed)
    }

    // Config load/save
    {
      const configPath = path.join(
        ROOT,
        'Pal',
        'Saved',
        'Config',
        'WindowsServer',
        'PalWorldSettings.ini'
      )
      assert('Config file exists', fs.existsSync(configPath))
      const raw = fs.readFileSync(configPath, 'utf8')
      const values = parseOptionSettings(raw)
      values.ExpRate = 3.5
      values.ServerName = 'E2E Server'
      fs.writeFileSync(configPath, serializeConfig(values), 'utf8')
      const again = parseOptionSettings(fs.readFileSync(configPath, 'utf8'))
      assert('Config roundtrip ExpRate', again.ExpRate === 3.5)
      assert('Config roundtrip ServerName', again.ServerName === 'E2E Server')
    }

    // SaveGames backup copy
    {
      const saveSrc = path.join(ROOT, 'Pal', 'Saved', 'SaveGames')
      const backupDest = path.join(ROOT, 'PSM_Backups', 'test_manual', 'SaveGames')
      fs.cpSync(saveSrc, backupDest, { recursive: true })
      assert('Backup copy created', fs.existsSync(path.join(backupDest, '0', 'Level.sav')))
    }

    // Logs written
    {
      const logPath = path.join(ROOT, 'Pal', 'Saved', 'Logs', 'Pal.log')
      assert('Log file exists', fs.existsSync(logPath))
      const content = fs.readFileSync(logPath, 'utf8')
      assert('Log contains broadcast', content.includes('Broadcast'))
    }

    // Mods listing
    {
      const modsDir = path.join(ROOT, 'Pal', 'Content', 'Paks', '~mods')
      const mods = fs.readdirSync(modsDir)
      assert('Mods folder has pak', mods.some((m) => m.endsWith('.pak') || m.includes('.pak')))
    }

    console.log('\nAll e2e checks passed:')
    for (const r of results) console.log(' ', r)
  } catch (err) {
    console.error('\nE2E FAILED')
    console.error(err)
    console.error('Simulator log:\n', simLog)
    process.exitCode = 1
  } finally {
    if (sim.pid) {
      try {
        process.kill(-sim.pid, 'SIGKILL')
      } catch {
        try {
          sim.kill('SIGKILL')
        } catch {
          // ignore
        }
      }
    }
    process.exit(process.exitCode ?? 0)
  }
}

void main()
