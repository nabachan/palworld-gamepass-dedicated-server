import { useState } from 'react'
import type { ServerStatus, ToastPayload } from '../../../shared/types'

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function OverviewPage({
  status,
  onToast,
  onGoSettings
}: {
  status: ServerStatus | null
  onToast: (t: ToastPayload) => void
  onGoSettings: () => void
}) {
  const [busy, setBusy] = useState<string | null>(null)

  const run = async (key: string, fn: () => Promise<{ ok: boolean; message: string }>) => {
    setBusy(key)
    try {
      const result = await fn()
      onToast({
        type: result.ok ? 'success' : 'error',
        title: key,
        message: result.message
      })
    } catch (err) {
      onToast({
        type: 'error',
        title: key,
        message: err instanceof Error ? err.message : String(err)
      })
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      {status?.lastError && <div className="alert error">{status.lastError}</div>}

      <div className="grid-4">
        <div className="stat-tile">
          <div className="stat-label">Statut</div>
          <div className="stat-value" style={{ fontSize: '1.15rem' }}>
            {status?.onlineStatus === 'online' ? 'En ligne' : 'Hors ligne'}
          </div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Joueurs</div>
          <div className="stat-value">
            {status ? `${status.playerCount}/${status.maxPlayers}` : '—'}
          </div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Uptime</div>
          <div className="stat-value" style={{ fontSize: '1.15rem' }}>
            {status?.process.running ? formatUptime(status.process.uptimeSeconds) : '—'}
          </div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">CPU / RAM</div>
          <div className="stat-value" style={{ fontSize: '1.05rem' }}>
            {status?.process.running
              ? `${status.process.cpuPercent.toFixed(1)}% · ${status.process.memoryMb} Mo`
              : '—'}
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h2 className="panel-title">Contrôle serveur</h2>
        <p className="panel-desc">
          Démarrez, arrêtez ou redémarrez le processus dédié. La sauvegarde manuelle passe par RCON
          (commande Save).
        </p>
        <div className="btn-row">
          <button
            className="btn primary"
            disabled={busy !== null}
            onClick={() => void run('Démarrer', () => window.palworld.startServer())}
            type="button"
          >
            {busy === 'Démarrer' ? '…' : 'Start'}
          </button>
          <button
            className="btn danger"
            disabled={busy !== null}
            onClick={() => void run('Arrêter', () => window.palworld.stopServer())}
            type="button"
          >
            Stop
          </button>
          <button
            className="btn warm"
            disabled={busy !== null}
            onClick={() => void run('Redémarrer', () => window.palworld.restartServer())}
            type="button"
          >
            Restart
          </button>
          <button
            className="btn"
            disabled={busy !== null}
            onClick={() => void run('Sauvegarde', () => window.palworld.saveWorld())}
            type="button"
          >
            Save (RCON)
          </button>
          <button className="btn" onClick={onGoSettings} type="button">
            Paramètres
          </button>
        </div>
      </div>

      <div className="panel">
        <h2 className="panel-title">Connexion RCON</h2>
        <p className="panel-desc">
          {status?.rconConnected
            ? 'RCON connecté — les commandes joueurs / annonces / save sont disponibles.'
            : 'RCON déconnecté. Vérifiez le chemin serveur, le port et le mot de passe AdminPassword.'}
        </p>
        <div className="grid-3">
          <div className="stat-tile">
            <div className="stat-label">RCON</div>
            <div className="stat-value" style={{ fontSize: '1rem' }}>
              {status?.rconConnected ? 'Connecté' : 'Déconnecté'}
            </div>
          </div>
          <div className="stat-tile">
            <div className="stat-label">PID</div>
            <div className="stat-value" style={{ fontSize: '1rem' }}>
              {status?.process.pid ?? '—'}
            </div>
          </div>
          <div className="stat-tile">
            <div className="stat-label">Démarré</div>
            <div className="stat-value" style={{ fontSize: '0.95rem' }}>
              {status?.process.startedAt
                ? new Date(status.process.startedAt).toLocaleString()
                : '—'}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
