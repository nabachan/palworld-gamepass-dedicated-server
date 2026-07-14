import { useState } from 'react'
import type { ToastPayload } from '../../../shared/types'

export function BroadcastPage({ onToast }: { onToast: (t: ToastPayload) => void }) {
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const send = async () => {
    setBusy(true)
    try {
      const r = await window.palworld.broadcast(message)
      onToast({ type: r.ok ? 'success' : 'error', title: 'Broadcast', message: r.message })
      if (r.ok) setMessage('')
    } catch (err) {
      onToast({
        type: 'error',
        title: 'Broadcast',
        message: err instanceof Error ? err.message : String(err)
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="panel">
      <h2 className="panel-title">Annonce à tous les joueurs</h2>
      <p className="panel-desc">Envoie un message via RCON Broadcast.</p>
      <div className="field">
        <label>Message</label>
        <textarea
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Redémarrage dans 5 minutes…"
        />
      </div>
      <button
        className="btn primary"
        disabled={busy || !message.trim()}
        onClick={() => void send()}
        type="button"
      >
        {busy ? 'Envoi…' : 'Envoyer'}
      </button>
    </div>
  )
}
