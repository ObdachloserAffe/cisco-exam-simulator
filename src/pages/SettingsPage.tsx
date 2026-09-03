import { useSettingsStore } from "../store/settingsStore";
import "./SettingsPage.css";

export default function SettingsPage() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const resetSettings = useSettingsStore((s) => s.resetSettings);

  return (
    <div>
      <header className="page-header">
        <h1>Einstellungen</h1>
        <p className="page-sub">Standardwerte für neue Prüfungen. Alle Daten bleiben lokal auf diesem Gerät.</p>
      </header>

      <div className="card panel settings-panel">
        <SettingRow label="Fragen pro Prüfung">
          <input
            type="number"
            className="text-input"
            min={1}
            value={settings.questionsPerExam}
            onChange={(e) => updateSettings({ questionsPerExam: Number(e.target.value) })}
          />
        </SettingRow>

        <SettingRow label="Prüfungszeit (Minuten)">
          <input
            type="number"
            className="text-input"
            min={0}
            value={settings.examTimeMinutes}
            onChange={(e) => updateSettings({ examTimeMinutes: Number(e.target.value) })}
          />
        </SettingRow>

        <SettingRow label="Bestehensgrenze (%)">
          <input
            type="number"
            className="text-input"
            min={1}
            max={100}
            value={settings.passThreshold}
            onChange={(e) => updateSettings({ passThreshold: Number(e.target.value) })}
          />
        </SettingRow>

        <SettingRow label="Fragen zufällig auswählen">
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={settings.shuffleQuestions}
              onChange={(e) => updateSettings({ shuffleQuestions: e.target.checked })}
            />
            {settings.shuffleQuestions ? "Ja" : "Nein"}
          </label>
        </SettingRow>

        <SettingRow label="Antwortreihenfolge zufällig">
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={settings.shuffleOptions}
              onChange={(e) => updateSettings({ shuffleOptions: e.target.checked })}
            />
            {settings.shuffleOptions ? "Ja" : "Nein"}
          </label>
        </SettingRow>

        <div className="cta-row" style={{ marginTop: 8 }}>
          <button className="btn btn-danger" onClick={resetSettings}>
            Auf Standardwerte zurücksetzen
          </button>
        </div>
      </div>

      <div className="card panel" style={{ marginTop: 16 }}>
        <h3 className="panel-title">Datenschutz</h3>
        <p className="privacy-text">
          Diese Anwendung läuft vollständig lokal in deinem Browser. Fragen, Prüfungsergebnisse und Einstellungen
          werden ausschließlich im LocalStorage dieses Geräts gespeichert. Es werden keine Daten an externe Server,
          APIs oder Analytics-Dienste gesendet.
        </p>
      </div>
    </div>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="setting-row">
      <label className="config-label">{label}</label>
      {children}
    </div>
  );
}
