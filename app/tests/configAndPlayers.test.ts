import { describe, expect, it } from 'vitest'
import { parseOptionSettings, serializeConfig } from '../src/shared/iniCodec'
import { parseShowPlayers } from '../src/shared/parsePlayers'

describe('parseOptionSettings', () => {
  it('parses boolean number and string values', () => {
    const ini = `[/Script/Pal.PalGameWorldSettings]
OptionSettings=(ServerName="Test Server",ExpRate=2.500000,bIsPvP=False,RCONEnabled=True,CrossplayPlatforms=(Steam,Xbox),DeathPenalty=Item)
`
    const values = parseOptionSettings(ini)
    expect(values.ServerName).toBe('Test Server')
    expect(values.ExpRate).toBe(2.5)
    expect(values.bIsPvP).toBe(false)
    expect(values.RCONEnabled).toBe(true)
    expect(values.CrossplayPlatforms).toBe('(Steam,Xbox)')
    expect(values.DeathPenalty).toBe('Item')
  })

  it('round-trips serialize then parse', () => {
    const original = parseOptionSettings(
      'OptionSettings=(ServerName="Round Trip",ServerPlayerMaxNum=16,bUseAuth=True)'
    )
    const serialized = serializeConfig(original)
    const again = parseOptionSettings(serialized)
    expect(again.ServerName).toBe('Round Trip')
    expect(again.ServerPlayerMaxNum).toBe(16)
    expect(again.bUseAuth).toBe(true)
  })
})

describe('parseShowPlayers', () => {
  it('parses CSV output', () => {
    const raw = `name,playeruid,steamid
Ash,1,76561198000000001
Misty,2,76561198000000002`
    const players = parseShowPlayers(raw)
    expect(players).toHaveLength(2)
    expect(players[0].name).toBe('Ash')
    expect(players[0].steamId).toBe('76561198000000001')
  })
})
