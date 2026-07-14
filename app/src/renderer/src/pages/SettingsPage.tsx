import { useEffect, useState } from 'react'
import type { AppSettings, ToastPayload } from '../../../shared/types'

export function SettingsPage({ onToast }: { onToast: (t: ToastPayload) => void }) {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [rconPassword, setRconPassword] = useState('')
  const [logPath, setLogPath] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(async () => {
      setSettings(await window.palworld.getSettings())
      setLogPath(await window.palworld.getAppLogPath())
    })()
  }, [])

  if (!settings) return <div className="panel">Chargement des paramètres…</div>

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings({ ...settings, [key]: value })
  }

  const browse = async () => {
    const dir = await window.palworld.pickDirectory()
    if (dir) update('serverPath', dir)
  }

  const save = async () => {
    setSaving(true)
    try {
      const saved = await window.palworld.saveSettings({
        serverPath: settings.serverPath,
        rconHost: settings.rconHost,
        rconPort: settings.rconPort,
        gamePort: settings.gamePort,
        autoBackupEnabled: settings.autoBackupEnabled,
        autoBackupIntervalMinutes: settings.autoBackupIntervalMinutes,
        autoBackupKeepCount: settings.autoBackupKeepCount,
        launchArgs: settings.launchArgs,
        useSimulator: settings.useSimulator,
        language: settings.language,
        ...(rconPassword ? { rconPassword } : {})
      })
      setSettings(saved)
      setRconPassword('')
      onToast({ type: 'success', title: 'Paramètres', message: 'Enregistrés.' })
    } catch (err) {
      onToast({
        type: 'error',
        title: 'Paramètres',
        message: err instanceof Error ? err.message : String(err)
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="panel">
        <h2 className="panel-title">Installation Palworld</h2>
        <p className="panel-desc">
          Chemin vers le dossier du serveur dédié (celui qui contient PalServer.exe).
        </p>
        <div className="field-row">
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Chemin serveur</label>
            <input
              value={settings.serverPath}
              onChange={(e) => update('serverPath', e.target.value)}
              placeholder="C:\\PalworldDedicatedServer\\server"
            />
          </div>
          <button className="btn" onClick={() => void browse()} type="button">
            Parcourir…
          </button>
        </div>
        <div className="field" style={{ marginTop: 14 }}>
          <label>Arguments de lancement</label>
          <input
            value={settings.launchArgs}
            onChange={(e) => update('launchArgs', e.target.value)}
          />
        </div>
        <div className="toggle">
          <div>
            <strong>Mode simulateur</strong>
            <div className="hint">
              Utilise un faux serveur RCON local pour tester sans installer Palworld.
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.useSimulator}
            onChange={(e) => update('useSimulator', e.target.checked)}
          />
        </div>
      </div>

      <div className="panel">
        <h2 className="panel-title">RCON</h2>
        <p className="panel-desc">
          Mot de passe stocké via le coffre-fort OS (Electron safeStorage), jamais en clair dans
          settings.json.
          {settings.hasRconPassword ? ' Un mot de passe est déjà enregistré.' : ' Aucun mot de passe enregistré.'}
        </p>
        <div className="grid-3">
          <div className="field">
            <label>Hôte</label>
            <input
              value={settings.rconHost}
              onChange={(e) => update('rconHost', e.target.value)}
            />
          </div>
          <div className="field">
            <label>Port RCON</label>
            <input
              type="number"
              value={settings.rconPort}
              onChange={(e) => update('rconPort', Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label>Port jeu</label>
            <input
              type="number"
              value={settings.gamePort}
              onChange={(e) => update('gamePort', Number(e.target.value))}
            />
          </div>
        </div>
        <div className="field">
          <label>Mot de passe RCON {settings.hasRconPassword ? '(laisser vide pour conserver)' : ''}</label>
          <input
            type="password"
            value={rconPassword}
            onChange={(e) => setRconPassword(e.target.value)}
            placeholder="AdminPassword du serveur"
            autoComplete="new-password"
          />
        </div>
      </div>

      <div className="panel">
        <h2 className="panel-title">Backups automatiques</h2>
        <div className="toggle">
          <div>
            <strong>Activer</strong>
            <div className="hint">Copie programmée du dossier SaveGames.</div>
          </div>
          <input
            type="checkbox"
            checked={settings.autoBackupEnabled}
            onChange={(e) => update('autoBackupEnabled', e.target.checked)}
          />
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Intervalle (minutes)</label>
            <input
              type="number"
              min={5}
              value={settings.autoBackupIntervalMinutes}
              onChange={(e) => update('autoBackupIntervalMinutes', Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label>Conserver (nombre)</label>
            <input
              type="number"
              min={1}
              value={settings.autoBackupKeepCount}
              onChange={(e) => update('autoBackupKeepCount', Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div className="panel">
        <h2 className="panel-title">Diagnostic</h2>
        <p className="panel-desc">Journal interne de l’application : {logPath || '…'}</p>
        <div className="btn-row">
          <button
            className="btn"
            onClick={() => void window.palworld.openPath(logPath)}
            type="button"
            disabled={!logPath}
          >
            Ouvrir app.log
          </button>
          <button className="btn primary" disabled={saving} onClick={() => void save()} type="button">
            {saving ? 'Enregistrement…' : 'Enregistrer les paramètres'}
          </button>
        </div>
      </div>
    </>
  )
}
