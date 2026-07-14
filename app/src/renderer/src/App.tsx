import { useEffect, useState } from 'react'
import type { ServerStatus, ToastPayload } from '../../shared/types'
import { Sidebar } from './components/Sidebar'
import { ToastStack } from './components/ToastStack'
import { OverviewPage } from './pages/OverviewPage'
import { PlayersPage } from './pages/PlayersPage'
import { ConfigPage } from './pages/ConfigPage'
import { BackupsPage } from './pages/BackupsPage'
import { LogsPage } from './pages/LogsPage'
import { ModsPage } from './pages/ModsPage'
import { SettingsPage } from './pages/SettingsPage'
import { BroadcastPage } from './pages/BroadcastPage'

export type PageId =
  | 'overview'
  | 'players'
  | 'config'
  | 'backups'
  | 'logs'
  | 'broadcast'
  | 'mods'
  | 'settings'

const TITLES: Record<PageId, string> = {
  overview: 'Vue d’ensemble',
  players: 'Joueurs',
  config: 'Configuration',
  backups: 'Sauvegardes',
  logs: 'Logs en direct',
  broadcast: 'Annonces',
  mods: 'Mods',
  settings: 'Paramètres'
}

export default function App() {
  const [page, setPage] = useState<PageId>('overview')
  const [status, setStatus] = useState<ServerStatus | null>(null)
  const [toasts, setToasts] = useState<(ToastPayload & { id: string })[]>([])
  const [bootError, setBootError] = useState<string | null>(null)

  const pushToast = (toast: ToastPayload): void => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { ...toast, id }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4500)
  }

  useEffect(() => {
    let unsubStatus = (): void => undefined
    let unsubToast = (): void => undefined
    ;(async () => {
      try {
        if (!window.palworld) {
          setBootError('Bridge Electron indisponible. Relancez l’application.')
          return
        }
        const initial = await window.palworld.getStatus()
        setStatus(initial)
        unsubStatus = window.palworld.onStatusUpdated(setStatus)
        unsubToast = window.palworld.onToast(pushToast)
      } catch (err) {
        setBootError(err instanceof Error ? err.message : String(err))
      }
    })()
    return () => {
      unsubStatus()
      unsubToast()
    }
  }, [])

  return (
    <div className="app-shell">
      <Sidebar page={page} onNavigate={setPage} status={status} />
      <div className="main-area">
        <header className="topbar">
          <div>
            <h1>{TITLES[page]}</h1>
            <div className="topbar-meta">
              {status?.serverName || 'Palworld Server Manager'}
              {status?.lastUpdatedAt
                ? ` · MAJ ${new Date(status.lastUpdatedAt).toLocaleTimeString()}`
                : ''}
            </div>
          </div>
          <StatusBadge status={status} />
        </header>
        <main className="content">
          {bootError && <div className="alert error">{bootError}</div>}
          {page === 'overview' && (
            <OverviewPage status={status} onToast={pushToast} onGoSettings={() => setPage('settings')} />
          )}
          {page === 'players' && <PlayersPage onToast={pushToast} />}
          {page === 'config' && <ConfigPage onToast={pushToast} />}
          {page === 'backups' && <BackupsPage onToast={pushToast} />}
          {page === 'logs' && <LogsPage />}
          {page === 'broadcast' && <BroadcastPage onToast={pushToast} />}
          {page === 'mods' && <ModsPage onToast={pushToast} />}
          {page === 'settings' && <SettingsPage onToast={pushToast} />}
        </main>
      </div>
      <ToastStack toasts={toasts} />
    </div>
  )
}

function StatusBadge({ status }: { status: ServerStatus | null }) {
  if (!status) return <span className="status-pill warning">Chargement…</span>
  if (status.onlineStatus === 'online') {
    return (
      <span className="status-pill online">
        <span className="status-dot" />
        En ligne
        {!status.rconConnected ? ' · RCON off' : ''}
      </span>
    )
  }
  return (
    <span className="status-pill offline">
      <span className="status-dot" />
      Hors ligne
    </span>
  )
}
