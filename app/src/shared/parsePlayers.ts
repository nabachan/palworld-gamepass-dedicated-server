export function parseShowPlayers(
  raw: string
): { name: string; playerUid: string; steamId: string }[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  const players: { name: string; playerUid: string; steamId: string }[] = []
  for (const line of lines) {
    if (/^name\s*,/i.test(line)) continue
    if (/^players?\s*:/i.test(line)) continue

    const parts = line.split(',').map((p) => p.trim())
    if (parts.length >= 3) {
      players.push({
        name: parts[0],
        playerUid: parts[1],
        steamId: parts[2]
      })
      continue
    }

    const m = line.match(/^(.+?)\s*\(([^)]+)\)\s*$/)
    if (m) {
      players.push({ name: m[1].trim(), playerUid: '', steamId: m[2].trim() })
    }
  }
  return players
}
