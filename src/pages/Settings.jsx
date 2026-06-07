import { useState } from 'react';
import useStore from '../store/useStore';

function ApiKeyField({ label, value, onChange, placeholder, hint }) {
  const [show, setShow] = useState(false);
  return (
    <div className="input-group">
      <label className="input-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          className="input-field"
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', paddingRight: 44 }}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-text-muted)', fontSize: 14,
          }}
        >
          {show ? '○' : '●'}
        </button>
      </div>
      {hint && <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

export default function Settings() {
  const { claudeApiKey, trelloApiKey, trelloToken, setClaudeApiKey, setTrelloApiKey, setTrelloToken, addToast } = useStore();

  const [claude, setClaude] = useState(claudeApiKey);
  const [tKey, setTKey] = useState(trelloApiKey);
  const [tToken, setTToken] = useState(trelloToken);

  const handleSave = () => {
    setClaudeApiKey(claude);
    setTrelloApiKey(tKey);
    setTrelloToken(tToken);
    addToast({ type: 'success', message: 'Configuración guardada correctamente' });
  };

  const hasChanges = claude !== claudeApiKey || tKey !== trelloApiKey || tToken !== trelloToken;

  return (
    <div className="page-container" style={{ maxWidth: 640 }}>
      <div className="page-header">
        <h1 className="page-title">Configuración</h1>
        <p className="page-subtitle">API keys y preferencias del sistema</p>
      </div>

      {/* Claude */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 18,
          }}>✦</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 'var(--text-md)' }}>Claude AI</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
              Modelo: claude-haiku-4-5-20251001
            </div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <span className={`badge ${claudeApiKey ? 'badge-success' : 'badge-muted'}`}>
              {claudeApiKey ? 'Configurado' : 'Sin configurar'}
            </span>
          </div>
        </div>

        <ApiKeyField
          label="API Key de Claude (Anthropic)"
          value={claude}
          onChange={setClaude}
          placeholder="sk-ant-..."
          hint="Consigue tu API key en console.anthropic.com"
        />
      </div>

      {/* Trello */}
      <div className="card" style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'linear-gradient(135deg, #0079bf, #00aecc)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 18,
          }}>⬆</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 'var(--text-md)' }}>Trello</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
              REST API v1
            </div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <span className={`badge ${trelloApiKey && trelloToken ? 'badge-success' : 'badge-muted'}`}>
              {trelloApiKey && trelloToken ? 'Configurado' : 'Sin configurar'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ApiKeyField
            label="API Key de Trello"
            value={tKey}
            onChange={setTKey}
            placeholder="tu-trello-api-key"
            hint="Obtén tu API key en trello.com/app-key"
          />
          <ApiKeyField
            label="Token de Trello"
            value={tToken}
            onChange={setTToken}
            placeholder="tu-trello-token"
            hint="Genera el token desde la misma página de API key"
          />
        </div>
      </div>

      {/* Storage info */}
      <div className="card" style={{ marginBottom: 32, background: 'var(--color-bg-alt)', border: 'none' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 20, opacity: 0.5 }}>ℹ</span>
          <div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 4 }}>Almacenamiento local</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              Todos los datos (clientes, planificaciones, API keys) se guardan en el <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--color-border)', padding: '1px 5px', borderRadius: 4 }}>localStorage</code> de tu navegador. No se envía nada a servidores externos excepto las llamadas directas a Claude y Trello.
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={!hasChanges}
          style={{ opacity: !hasChanges ? 0.5 : 1 }}
        >
          Guardar cambios
        </button>
        {hasChanges && (
          <button className="btn btn-ghost" onClick={() => { setClaude(claudeApiKey); setTKey(trelloApiKey); setTToken(trelloToken); }}>
            Descartar
          </button>
        )}
      </div>
    </div>
  );
}
