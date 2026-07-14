import { useCallback, useEffect, useState } from 'react'
import type { BackupInfo, ToastPayload } from '../../../shared/types'

function formatBytes(n: number): string {
  if (n < 1024) return `${n} o`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} Ko`
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} Mo`
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} Go`
}

export function BackupsPage({ onToast }: { onToast: (t: ToastPayload) => void }) {
  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setError(null)
      setBackups(await window.palworld.listBackups())
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const create = async () => {
    setBusy(true)
    try {
      const b = await window.palworld.createBackup()
      onToast({ type: 'success', title: 'Backup', message: `Créé : ${b.name}` })
      await refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      onToast({ type: 'error', title: 'Backup', message })
    } finally {
      setBusy(false)
    }
  }

  const restore = async (id: string) => {
    if (!confirm(`Restaurer le backup « ${id} » ? Une copie de sécurité sera créée.`)) return
    setBusy(true)
    try {
      const r = await window.palworld.restoreBackup(id)
      onToast({ type: r.ok ? 'success' : 'error', title: 'Restauration', message: r.message })
      await refresh()
    } catch (err) {
      onToast({
        type: 'error',
        title: 'Restauration',
        message: err instanceof Error ? err.message : String(err)
      })
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm(`Supprimer définitivement « ${id} » ?`)) return
    setBusy(true)
    try {
      const r = await window.palworld.deleteBackup(id)
      onToast({ type: r.ok ? 'success' : 'error', title: 'Suppression', message: r.message })
      await refresh()
    } catch (err) {
      onToast({
        type: 'error',
        title: 'Suppression',
        message: err instanceof Error ? err.message : String(err)
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {error && <div className="alert error">{error}</div>}
      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 className="panel-title">Sauvegardes SaveGames</h2>
            <p className="panel-desc" style={{ marginBottom: 0 }}>
              Copies horodatées du dossier SaveGames. Les backups auto se configurent dans Paramètres.
            </p>
          </div>
          <button className="btn primary" disabled={busy} onClick={() => void create()} type="button">
            {busy ? '…' : 'Créer un backup'}
          </button>
        </div>

        {backups.length === 0 ? (
          <div className="empty">Aucun backup pour le moment.</div>
        ) : (
          <table className="table" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Type</th>
                <th>Date</th>
                <th>Taille</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((b) => (
                <tr key={b.id}>
                  <td>{b.name}</td>
                  <td>{b.kind}</td>
                  <td>{new Date(b.createdAt).toLocaleString()}</td>
                  <td>{formatBytes(b.sizeBytes)}</td>
                  <td>
                    <div className="btn-row">
                      <button className="btn" disabled={busy} onClick={() => void restore(b.id)} type="button">
                        Restaurer
                      </button>
                      <button
                        className="btn danger"
                        disabled={busy}
                        onClick={() => void remove(b.id)}
                        type="button"
                      >
                        Supprimer
                      </button>
                    </div>
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
