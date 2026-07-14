import type { ToastPayload } from '../../../shared/types'

export function ToastStack({
  toasts
}: {
  toasts: (ToastPayload & { id: string })[]
}) {
  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          <strong>{t.title}</strong>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
