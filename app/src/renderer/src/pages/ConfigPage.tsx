import { useEffect, useMemo, useState } from 'react'
import type { ConfigFieldMeta, ConfigState, ConfigValues, ToastPayload } from '../../../shared/types'

export function ConfigPage({ onToast }: { onToast: (t: ToastPayload) => void }) {
  const [schema, setSchema] = useState<ConfigFieldMeta[]>([])
  const [state, setState] = useState<ConfigState | null>(null)
  const [values, setValues] = useState<ConfigValues>({})
  const [category, setCategory] = useState<string>('Identité')
  const [filter, setFilter] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const [s, c] = await Promise.all([
          window.palworld.getConfigSchema(),
          window.palworld.getConfig()
        ])
        setSchema(s)
        setState(c)
        setValues(c.values)
        if (s[0]) setCategory(s[0].category)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      }
    })()
  }, [])

  const categories = useMemo(
    () => [...new Set(schema.map((f) => f.category))],
    [schema]
  )

  const fields = useMemo(() => {
    const q = filter.trim().toLowerCase()
    return schema.filter((f) => {
      if (f.category !== category) return false
      if (!q) return true
      return (
        f.key.toLowerCase().includes(q) ||
        f.label.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q)
      )
    })
  }, [schema, category, filter])

  const setValue = (key: string, value: string | number | boolean) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const next = await window.palworld.saveConfig(values)
      setState(next)
      setValues(next.values)
      onToast({ type: 'success', title: 'Config', message: 'PalWorldSettings.ini enregistré.' })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      onToast({ type: 'error', title: 'Config', message })
    } finally {
      setSaving(false)
    }
  }

  const reload = async () => {
    const c = await window.palworld.getConfig()
    setState(c)
    setValues(c.values)
    onToast({ type: 'info', title: 'Config', message: 'Rechargée depuis le disque.' })
  }

  return (
    <>
      {error && <div className="alert error">{error}</div>}
      {state?.warnings.map((w) => (
        <div key={w} className="alert">
          {w}
        </div>
      ))}

      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 className="panel-title">Éditeur PalWorldSettings.ini</h2>
            <p className="panel-desc" style={{ marginBottom: 0 }}>
              {state?.path || 'Aucun fichier'} {state?.exists ? '' : '(absent)'}
            </p>
          </div>
          <div className="btn-row">
            <button className="btn" onClick={() => void reload()} type="button">
              Recharger
            </button>
            <button className="btn primary" disabled={saving} onClick={() => void save()} type="button">
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>

        <div className="field" style={{ marginTop: 16 }}>
          <input
            placeholder="Filtrer un paramètre…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        <div className="category-tabs">
          {categories.map((c) => (
            <button
              key={c}
              className={category === c ? 'active' : ''}
              onClick={() => setCategory(c)}
              type="button"
            >
              {c}
            </button>
          ))}
        </div>

        {fields.map((field) => (
          <ConfigField
            key={field.key}
            field={field}
            value={values[field.key]}
            onChange={(v) => setValue(field.key, v)}
          />
        ))}
        {fields.length === 0 && <div className="empty">Aucun paramètre dans cette catégorie.</div>}
      </div>
    </>
  )
}

function ConfigField({
  field,
  value,
  onChange
}: {
  field: ConfigFieldMeta
  value: string | number | boolean | undefined
  onChange: (v: string | number | boolean) => void
}) {
  if (field.type === 'boolean') {
    return (
      <div className="toggle">
        <div>
          <strong>{field.label}</strong>
          <div className="hint">{field.description}</div>
        </div>
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
      </div>
    )
  }

  if (field.type === 'number') {
    const num = typeof value === 'number' ? value : Number(value ?? 0)
    return (
      <div className="field">
        <label>
          {field.label}
          {field.unit ? ` (${field.unit})` : ''}
        </label>
        <div className="hint">{field.description}</div>
        <div className="slider-row">
          <input
            type="range"
            min={field.min ?? 0}
            max={field.max ?? 100}
            step={field.step ?? 1}
            value={Number.isFinite(num) ? num : 0}
            onChange={(e) => onChange(Number(e.target.value))}
          />
          <input
            type="number"
            min={field.min}
            max={field.max}
            step={field.step}
            value={Number.isFinite(num) ? num : 0}
            onChange={(e) => onChange(Number(e.target.value))}
          />
        </div>
      </div>
    )
  }

  if (field.type === 'enum' && field.options) {
    return (
      <div className="field">
        <label>{field.label}</label>
        <div className="hint">{field.description}</div>
        <select value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
          {field.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
    )
  }

  return (
    <div className="field">
      <label>{field.label}</label>
      <div className="hint">{field.description}</div>
      <input value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
