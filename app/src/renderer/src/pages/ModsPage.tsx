import { useCallback, useEffect, useState } from 'react'
import type { ModInfo, ToastPayload } from '../../../shared/types'

function formatBytes(n: number): string {
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} Ko`
  return `${(n / (1024 * 1024)).toFixed(1)} Mo`
}

export function ModsPage({ onToast }: { onToast: (t: ToastPayload) => void }) {
  const [mods, setMods] = useState<ModInfo[]>([])
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setError(null)
      setMods(await window.palworld.listMods())
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const toggle = async (mod: ModInfo) => {
    try {
      const next = await window.palworld.setModEnabled(mod.id, !mod.enabled)
      setMods(next)
      onToast({
        type: 'success',
        title: 'Mods',
        message: `${mod.name} ${mod.enabled ? 'désactivé' : 'activé'}.`
      })
    } catch (err) {
      onToast({
        type: 'error',
        title: 'Mods',
        message: err instanceof Error ? err.message : String(err)
      })
    }
  }

  return (
    <>
      {error && <div className="alert error">{error}</div>}
      <div className="panel">
        <h2 className="panel-title">Mods installés</h2>
        <p className="panel-desc">
          Détecte les fichiers <code>.pak</code> dans <code>Pal/Content/Paks/~mods</code>. La
          désactivation renomme en <code>.disabled</code> (redémarrage serveur recommandé).
        </p>
        {mods.length === 0 ? (
          <div className="empty">Aucun mod détecté (ou dossier absent).</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Taille</th>
                <th>État</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {mods.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>{formatBytes(m.sizeBytes)}</td>
                  <td>{m.enabled ? 'Actif' : 'Désactivé'}</td>
                  <td>
                    <button className="btn" onClick={() => void toggle(m)} type="button">
                      {m.enabled ? 'Désactiver' : 'Activer'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
