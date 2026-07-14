import type { ServerStatus } from '../../../shared/types'
import type { PageId } from '../App'

const ITEMS: { id: PageId; label: string; icon: string }[] = [
  { id: 'overview', label: 'Vue d’ensemble', icon: '◉' },
  { id: 'players', label: 'Joueurs', icon: '◍' },
  { id: 'config', label: 'Configuration', icon: '✎' },
  { id: 'backups', label: 'Sauvegardes', icon: '▤' },
  { id: 'logs', label: 'Logs', icon: '≡' },
  { id: 'broadcast', label: 'Annonces', icon: '☉' },
  { id: 'mods', label: 'Mods', icon: '✦' },
  { id: 'settings', label: 'Paramètres', icon: '⚙' }
]

export function Sidebar({
  page,
  onNavigate,
  status
}: {
  page: PageId
  onNavigate: (id: PageId) => void
  status: ServerStatus | null
}) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          Pal<span>world</span>
        </div>
        <div className="brand-sub">Server Manager</div>
      </div>
      <nav>
        {ITEMS.map((item) => (
          <button
            key={item.id}
            className={`nav-btn ${page === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
            type="button"
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div style={{ flex: 1 }} />
      <div className="panel" style={{ padding: '12px' }}>
        <div className="stat-label">Joueurs</div>
        <div className="stat-value" style={{ fontSize: '1.1rem' }}>
          {status ? `${status.playerCount} / ${status.maxPlayers}` : '—'}
        </div>
      </div>
    </aside>
  )
}
