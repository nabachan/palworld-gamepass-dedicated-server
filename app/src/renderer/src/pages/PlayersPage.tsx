import { useCallback, useEffect, useState } from 'react'
import type { PlayerInfo, ToastPayload, BanListState, WhitelistState } from '../../../shared/types'

export function PlayersPage({ onToast }: { onToast: (t: ToastPayload) => void }) {
  const [players, setPlayers] = useState<PlayerInfo[]>([])
  const [error, setError] = useState<string | null>(null)
  const [whitelist, setWhitelist] = useState<WhitelistState | null>(null)
  const [banlist, setBanlist] = useState<BanListState | null>(null)
  const [wlDraft, setWlDraft] = useState('')
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [p, w, b] = await Promise.all([
        window.palworld.getPlayers(),
        window.palworld.getWhitelist(),
        window.palworld.getBanList()
      ])
      setPlayers(p)
      setWhitelist(w)
      setBanlist(b)
      setWlDraft(w.entries.join('\n'))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setPlayers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const t = setInterval(() => void refresh(), 8000)
    return () => clearInterval(t)
  }, [refresh])

  const kick = async (steamId: string) => {
    const r = await window.palworld.kickPlayer(steamId)
    onToast({ type: r.ok ? 'success' : 'error', title: 'Kick', message: r.message })
    void refresh()
  }

  const ban = async (steamId: string) => {
    const r = await window.palworld.banPlayer(steamId)
    onToast({ type: r.ok ? 'success' : 'error', title: 'Ban', message: r.message })
    void refresh()
  }

  const saveWhitelist = async () => {
    const entries = wlDraft.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    const w = await window.palworld.setWhitelist(entries)
    setWhitelist(w)
    onToast({ type: 'success', title: 'Whitelist', message: `${w.entries.length} entrée(s) enregistrée(s).` })
  }

  const unban = async (steamId: string) => {
    const b = await window.palworld.unbanPlayer(steamId)
    setBanlist(b)
    onToast({ type: 'success', title: 'Unban', message: `${steamId} retiré de la banlist locale.` })
  }

  return (
    <>
      {error && <div className="alert error">{error}</div>}

      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
          <div>
            <h2 className="panel-title">Joueurs connectés</h2>
            <p className="panel-desc" style={{ marginBottom: 0 }}>
              Liste via RCON ShowPlayers.
            </p>
          </div>
          <button className="btn" disabled={loading} onClick={() => void refresh()} type="button">
            Rafraîchir
          </button>
        </div>
        {players.length === 0 ? (
          <div className="empty">Aucun joueur connecté (ou RCON indisponible).</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Player UID</th>
                <th>Steam ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={`${p.steamId}-${p.playerUid}-${p.name}`}>
                  <td>{p.name}</td>
                  <td>{p.playerUid || '—'}</td>
                  <td>{p.steamId || '—'}</td>
                  <td>
                    <div className="btn-row">
                      <button
                        className="btn warm"
                        disabled={!p.steamId}
                        onClick={() => void kick(p.steamId)}
                        type="button"
                      >
                        Kick
                      </button>
                      <button
                        className="btn danger"
                        disabled={!p.steamId}
                        onClick={() => void ban(p.steamId)}
                        type="button"
                      >
                        Ban
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="grid-2">
        <div className="panel">
          <h2 className="panel-title">Whitelist</h2>
          <p className="panel-desc">
            Un SteamID / UID par ligne. Fichier géré localement par l’app
            {whitelist ? ` (${whitelist.path})` : ''}.
          </p>
          <div className="field">
            <textarea rows={8} value={wlDraft} onChange={(e) => setWlDraft(e.target.value)} />
          </div>
          <button className="btn primary" onClick={() => void saveWhitelist()} type="button">
            Enregistrer whitelist
          </button>
        </div>

        <div className="panel">
          <h2 className="panel-title">Banlist locale</h2>
          <p className="panel-desc">
            Complète BanPlayer RCON. Retirez une entrée pour unban local.
          </p>
          {!banlist || banlist.entries.length === 0 ? (
            <div className="empty">Aucun ban local.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Steam ID</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {banlist.entries.map((id) => (
                  <tr key={id}>
                    <td>{id}</td>
                    <td>
                      <button className="btn" onClick={() => void unban(id)} type="button">
                        Unban
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
