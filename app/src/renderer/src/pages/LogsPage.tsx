import { useEffect, useMemo, useState } from 'react'
import type { LogLine } from '../../../shared/types'

export function LogsPage() {
  const [lines, setLines] = useState<LogLine[]>([])
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState<'all' | LogLine['level']>('all')

  useEffect(() => {
    let unsub = (): void => undefined
    ;(async () => {
      setLines(await window.palworld.getLogs())
      unsub = window.palworld.onLogsUpdated((incoming) => {
        setLines((prev) => {
          const map = new Map(prev.map((l) => [l.id, l]))
          for (const l of incoming) map.set(l.id, l)
          return [...map.values()].slice(-2000)
        })
      })
    })()
    return () => unsub()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return lines.filter((l) => {
      if (level !== 'all' && l.level !== level) return false
      if (!q) return true
      return l.message.toLowerCase().includes(q)
    })
  }, [lines, query, level])

  return (
    <div className="panel">
      <h2 className="panel-title">Logs serveur en direct</h2>
      <p className="panel-desc">
        Lecture en temps réel du fichier de log Palworld (filtre + recherche).
      </p>
      <div className="grid-2" style={{ marginBottom: 12 }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <input
            placeholder="Rechercher…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <select value={level} onChange={(e) => setLevel(e.target.value as typeof level)}>
            <option value="all">Tous les niveaux</option>
            <option value="info">Info</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
            <option value="debug">Debug</option>
            <option value="unknown">Autre</option>
          </select>
        </div>
      </div>
      <div className="log-view">
        {filtered.length === 0 ? (
          <div className="empty">Aucun log — démarrez le serveur ou vérifiez le chemin.</div>
        ) : (
          filtered.map((l) => (
            <div key={l.id} className={`log-line ${l.level}`}>
              {l.message}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
