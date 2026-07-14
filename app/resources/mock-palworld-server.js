#!/usr/bin/env node
/**
 * Standalone mock Palworld RCON server (no TypeScript runtime required).
 * Used by packaged app "simulator mode" and local tests.
 */
const net = require('net')
const fs = require('fs')
const path = require('path')

const args = process.argv.slice(2)
function arg(name, fallback) {
  const idx = args.indexOf(name)
  if (idx >= 0 && args[idx + 1]) return args[idx + 1]
  return fallback
}

const DATA_DIR = arg('--data', process.env.PALWORLD_SIM_DATA || path.join(process.cwd(), 'simulator-data'))
const RCON_PORT = Number(arg('--rcon-port', process.env.PALWORLD_SIM_RCON_PORT || '25575'))
const PASSWORD = process.env.PALWORLD_SIM_RCON_PASSWORD || 'admin'

const players = [
  { name: 'AshKetchum', playerUid: '10001', steamId: '76561198000000001' },
  { name: 'MistyWave', playerUid: '10002', steamId: '76561198000000002' }
]
const banned = new Set()

function appendLog(line) {
  const logPath = path.join(DATA_DIR, 'Pal', 'Saved', 'Logs', 'Pal.log')
  fs.mkdirSync(path.dirname(logPath), { recursive: true })
  fs.appendFileSync(logPath, `${new Date().toISOString()} ${line}\n`, 'utf8')
}

function ensureLayout() {
  const dirs = [
    path.join(DATA_DIR, 'Pal', 'Saved', 'Config', 'WindowsServer'),
    path.join(DATA_DIR, 'Pal', 'Saved', 'SaveGames', '0'),
    path.join(DATA_DIR, 'Pal', 'Saved', 'Logs'),
    path.join(DATA_DIR, 'Pal', 'Content', 'Paks', '~mods')
  ]
  for (const d of dirs) fs.mkdirSync(d, { recursive: true })

  const configPath = path.join(
    DATA_DIR,
    'Pal',
    'Saved',
    'Config',
    'WindowsServer',
    'PalWorldSettings.ini'
  )
  if (!fs.existsSync(configPath)) {
    const body =
      '[/Script/Pal.PalGameWorldSettings]\n' +
      'OptionSettings=(ServerName="Simulated Palworld",ServerDescription="Mock server",AdminPassword="admin",ServerPassword="",PublicPort=8211,PublicIP="",RCONEnabled=True,RCONPort=25575,ServerPlayerMaxNum=12,ExpRate=2.000000,PalCaptureRate=2.000000,DeathPenalty=Item,bIsPvP=False,bEnablePlayerToPlayerDamage=False,bEnableDefenseOtherGuildPlayer=False,bUseAuth=True,CrossplayPlatforms=(Steam,Xbox),AutoSaveSpan=30.000000,LogFormatType=Text)\n'
    fs.writeFileSync(configPath, body, 'utf8')
  }

  const saveMarker = path.join(DATA_DIR, 'Pal', 'Saved', 'SaveGames', '0', 'Level.sav')
  if (!fs.existsSync(saveMarker)) fs.writeFileSync(saveMarker, 'MOCK_SAVE_DATA', 'utf8')

  const modPath = path.join(DATA_DIR, 'Pal', 'Content', 'Paks', '~mods', 'ExampleQoL.pak')
  if (!fs.existsSync(modPath)) fs.writeFileSync(modPath, Buffer.alloc(128, 1))
  const disabled = path.join(DATA_DIR, 'Pal', 'Content', 'Paks', '~mods', 'OldMod.pak.disabled')
  if (!fs.existsSync(disabled)) fs.writeFileSync(disabled, Buffer.alloc(64, 2))

  appendLog(`[INFO] Mock Palworld server booting data=${DATA_DIR}`)
}

const SERVERDATA_AUTH = 3
const SERVERDATA_AUTH_RESPONSE = 2
const SERVERDATA_EXECCOMMAND = 2
const SERVERDATA_RESPONSE_VALUE = 0

function pack(id, type, body) {
  const bodyBuf = Buffer.from(body, 'utf8')
  const size = 4 + 4 + bodyBuf.length + 2
  const buf = Buffer.alloc(4 + size)
  buf.writeInt32LE(size, 0)
  buf.writeInt32LE(id, 4)
  buf.writeInt32LE(type, 8)
  bodyBuf.copy(buf, 12)
  buf.writeInt8(0, 12 + bodyBuf.length)
  buf.writeInt8(0, 12 + bodyBuf.length + 1)
  return buf
}

function handleCommand(cmd) {
  const trimmed = cmd.trim()
  appendLog(`[INFO] RCON command: ${trimmed}`)
  const lower = trimmed.toLowerCase()
  if (lower === 'showplayers') {
    const online = players.filter((p) => !banned.has(p.steamId))
    return ['name,playeruid,steamid', ...online.map((p) => `${p.name},${p.playerUid},${p.steamId}`)].join('\n')
  }
  if (lower.startsWith('broadcast ')) {
    appendLog(`[INFO] Broadcast: ${trimmed.slice(10)}`)
    return 'Broadcast received'
  }
  if (lower === 'save') {
    appendLog('[INFO] World saved')
    return 'Complete Save'
  }
  if (lower.startsWith('kickplayer ')) {
    const id = trimmed.split(/\s+/)[1]
    appendLog(`[WARN] Kicked ${id}`)
    return `Kicked: ${id}`
  }
  if (lower.startsWith('banplayer ')) {
    const id = trimmed.split(/\s+/)[1]
    banned.add(id)
    appendLog(`[WARN] Banned ${id}`)
    return `Banned: ${id}`
  }
  if (lower === 'info') return 'Welcome to Palworld / Simulated dedicated server v0.0.1'
  return `Unknown command: ${trimmed}`
}

ensureLayout()

const server = net.createServer((socket) => {
  let authenticated = false
  let buffer = Buffer.alloc(0)
  socket.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk])
    while (buffer.length >= 4) {
      const size = buffer.readInt32LE(0)
      if (buffer.length < 4 + size) break
      const packet = buffer.subarray(0, 4 + size)
      buffer = buffer.subarray(4 + size)
      const id = packet.readInt32LE(4)
      const type = packet.readInt32LE(8)
      const body = packet.subarray(12, 4 + size - 2).toString('utf8')
      if (type === SERVERDATA_AUTH) {
        if (body === PASSWORD) {
          authenticated = true
          socket.write(pack(id, SERVERDATA_AUTH_RESPONSE, ''))
          appendLog('[INFO] RCON client authenticated')
        } else {
          socket.write(pack(-1, SERVERDATA_AUTH_RESPONSE, ''))
          appendLog('[ERROR] RCON auth failed')
        }
        continue
      }
      if (!authenticated) {
        socket.write(pack(id, SERVERDATA_RESPONSE_VALUE, 'Not authenticated'))
        continue
      }
      if (type === SERVERDATA_EXECCOMMAND) {
        socket.write(pack(id, SERVERDATA_RESPONSE_VALUE, handleCommand(body)))
      }
    }
  })
  socket.on('error', () => {})
})

server.on('error', (err) => {
  console.error(`Mock server failed to bind ${RCON_PORT}:`, err.message)
  process.exit(1)
})

server.listen(RCON_PORT, '127.0.0.1', () => {
  appendLog(`[INFO] RCON listening on 127.0.0.1:${RCON_PORT}`)
  console.log(`Mock Palworld RCON on 127.0.0.1:${RCON_PORT} (password=${PASSWORD})`)
  console.log(`Data dir: ${DATA_DIR}`)
})

setInterval(() => {
  appendLog(`[INFO] Server tick players=${players.filter((p) => !banned.has(p.steamId)).length}`)
}, 10000)

process.on('SIGINT', () => {
  appendLog('[INFO] Shutting down mock server')
  server.close()
  process.exit(0)
})
process.on('SIGTERM', () => {
  server.close()
  process.exit(0)
})
