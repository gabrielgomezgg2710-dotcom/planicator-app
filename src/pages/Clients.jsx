import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import Modal from '../components/Modal';
import ClientAvatar, { clientGradient } from '../components/ClientAvatar';

const EMPTY_CLIENT = {
  name: '', industry: '', website: '',
  photo: '',
  contextText: '',
  contextAudio: '',
  teamDesign: '', teamCopy: '', teamVideo: '', teamSocial: '',
  trelloBoardId: '',
};

/* ── Photo upload ── */
function PhotoUpload({ value, onChange, clientName }) {
  const inputRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen no puede superar 2 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 8 }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {value ? (
          <img src={value} alt="logo" style={{ width: 72, height: 72, borderRadius: 14, objectFit: 'cover', border: '1px solid var(--color-border)' }} />
        ) : (
          <div style={{
            width: 72, height: 72, borderRadius: 14,
            background: 'var(--color-bg-alt)',
            border: '2px dashed var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 800, color: 'var(--color-text-muted)',
          }}>
            {clientName?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            style={{
              position: 'absolute', top: -7, right: -7,
              width: 22, height: 22, borderRadius: '50%',
              background: 'var(--color-danger)', color: '#fff',
              border: '2px solid #fff', cursor: 'pointer',
              fontSize: 13, lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >×</button>
        )}
      </div>
      <div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => inputRef.current?.click()}>
          {value ? 'Cambiar foto' : '+ Subir logo / foto'}
        </button>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 5, lineHeight: 1.5 }}>
          JPG, PNG, WebP · Máx. 2 MB<br />Se guarda localmente
        </div>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
      </div>
    </div>
  );
}

/* ── Audio recorder ── */
const MAX_SECONDS = 120;

function fmt(s) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

function AudioRecorder({ value, onChange }) {
  const [state, setState] = useState('idle');
  const [seconds, setSeconds] = useState(0);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];

      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => onChange(reader.result);
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
        setState('done');
        clearInterval(timerRef.current);
      };

      mr.start();
      recorderRef.current = mr;
      setState('recording');
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_SECONDS) {
            recorderRef.current?.stop();
            clearInterval(timerRef.current);
          }
          return s + 1;
        });
      }, 1000);
    } catch {
      alert('No se pudo acceder al micrófono. Verifica los permisos del navegador.');
    }
  };

  const stop = () => {
    recorderRef.current?.stop();
    clearInterval(timerRef.current);
  };

  const clear = () => {
    onChange('');
    setState('idle');
    setSeconds(0);
  };

  const progress = Math.min((seconds / MAX_SECONDS) * 100, 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {state === 'recording' ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          background: '#fff5f5',
          border: '1px solid #fecaca',
          borderRadius: 'var(--radius-md)',
          padding: '10px 16px',
        }}>
          <div style={{
            width: 9, height: 9, borderRadius: '50%',
            background: 'var(--color-danger)',
            animation: 'pulse-rec 1s ease-in-out infinite',
            flexShrink: 0,
          }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--color-danger)', fontWeight: 600, minWidth: 40 }}>
            {fmt(seconds)}
          </span>
          <div style={{ flex: 1, height: 3, background: '#fecaca', borderRadius: 100 }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'var(--color-danger)', borderRadius: 100, transition: 'width 1s linear' }} />
          </div>
          <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', minWidth: 32 }}>
            {fmt(MAX_SECONDS - seconds)}
          </span>
          <button type="button" className="btn btn-danger btn-sm" onClick={stop}>⏹ Detener</button>
        </div>
      ) : value ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
          flexWrap: 'wrap',
          gap: 10,
        }}>
          <audio src={value} controls style={{ height: 32, flex: 1, minWidth: 180 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={start}>🎙 Re-grabar</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={clear}>✕</button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={start}
          style={{ alignSelf: 'flex-start' }}
        >
          🎙 Grabar nota de voz
        </button>
      )}
      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
        Nota de voz para referencia interna · Máx. {fmt(MAX_SECONDS)} · El texto escrito es lo que Claude usa para generar contenido
      </div>
    </div>
  );
}

/* ── Client form ── */
function ClientForm({ initial = EMPTY_CLIENT, onSave, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY_CLIENT, ...initial });
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setVal = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Photo */}
      <PhotoUpload
        value={form.photo}
        onChange={(v) => setVal('photo', v)}
        clientName={form.name}
      />

      {/* Basic info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="input-group">
          <label className="input-label">Nombre del cliente *</label>
          <input className="input-field" value={form.name} onChange={set('name')} required placeholder="Ej: Nike Argentina" />
        </div>
        <div className="input-group">
          <label className="input-label">Industria</label>
          <input className="input-field" value={form.industry} onChange={set('industry')} placeholder="Ej: Deportes / Retail" />
        </div>
      </div>

      {/* Context — free text */}
      <div className="input-group">
        <label className="input-label">Contexto del cliente</label>
        <textarea
          className="input-field"
          value={form.contextText}
          onChange={set('contextText')}
          rows={7}
          placeholder="Describe al cliente: a qué se dedica, su tono, público objetivo, diferenciadores, servicios, valores de marca, lo que sea relevante...

Claude usará esto como contexto completo para generar el contenido."
          style={{ resize: 'vertical', lineHeight: 1.65 }}
        />
      </div>

      {/* Audio note */}
      <div className="input-group">
        <label className="input-label">Nota de voz (opcional)</label>
        <AudioRecorder
          value={form.contextAudio}
          onChange={(v) => setVal('contextAudio', v)}
        />
      </div>

      <div className="divider" style={{ margin: '0' }} />

      {/* Team */}
      <div>
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 12 }}>Equipo asignado</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[['teamDesign', 'Diseñador/a'], ['teamCopy', 'Copywriter'], ['teamVideo', 'Editor/a video'], ['teamSocial', 'Social Media']].map(([key, label]) => (
            <div key={key} className="input-group">
              <label className="input-label">{label}</label>
              <input className="input-field" value={form[key] || ''} onChange={set(key)} placeholder="Nombre del responsable" />
            </div>
          ))}
        </div>
      </div>

      {/* Trello */}
      <div className="input-group">
        <label className="input-label">Trello Board ID</label>
        <input
          className="input-field"
          value={form.trelloBoardId || ''}
          onChange={set('trelloBoardId')}
          placeholder="ID del tablero de Trello"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}
        />
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn-primary">Guardar cliente</button>
      </div>
    </form>
  );
}

/* ── Page ── */
export default function Clients() {
  const navigate = useNavigate();
  const { clients, addClient, updateClient, deleteClient, addToast } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = clients.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.industry?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = (form) => {
    if (editing) {
      updateClient(editing.id, form);
      addToast({ type: 'success', message: `Cliente "${form.name}" actualizado` });
    } else {
      addClient(form);
      addToast({ type: 'success', message: `Cliente "${form.name}" creado` });
    }
    setShowModal(false);
    setEditing(null);
  };

  const handleDelete = (client) => {
    if (!confirm(`¿Eliminar a "${client.name}"? Esta acción no se puede deshacer.`)) return;
    deleteClient(client.id);
    addToast({ type: 'warning', message: `Cliente "${client.name}" eliminado` });
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">{clients.length} cliente{clients.length !== 1 ? 's' : ''} registrado{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
          + Nuevo cliente
        </button>
      </div>

      {clients.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <input
            className="input-field"
            placeholder="Buscar por nombre o industria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 360 }}
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">◎</div>
          <div className="empty-state-title">{search ? 'Sin resultados' : 'Sin clientes aún'}</div>
          <div className="empty-state-desc">
            {search ? 'Prueba con otro término de búsqueda' : 'Agrega tu primer cliente para empezar a planificar'}
          </div>
          {!search && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Agregar cliente</button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filtered.map((client) => (
            <div
              key={client.id}
              className="card"
              style={{ transition: 'box-shadow var(--transition), transform var(--transition)' }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {/* Header with avatar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <ClientAvatar client={client} size={48} radius={12} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 'var(--text-md)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.name}</div>
                  {client.industry && (
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{client.industry}</div>
                  )}
                </div>
                {client.contextAudio && (
                  <span title="Tiene nota de voz" style={{ fontSize: 14, opacity: 0.5 }}>🎙</span>
                )}
              </div>

              {/* Context preview */}
              {(client.contextText || client.businessDesc) && (
                <p style={{
                  fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)',
                  lineHeight: 1.55, marginBottom: 14,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {client.contextText || client.businessDesc}
                </p>
              )}

              {/* Badges from old fields (backward compat) */}
              {(client.tone || client.audience) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  {client.tone && <span className="badge badge-primary">{client.tone}</span>}
                  {client.audience && <span className="badge badge-muted">{client.audience}</span>}
                </div>
              )}

              <div className="divider" style={{ margin: '10px 0' }} />

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => navigate(`/clients/${client.id}`)}>
                  Ver brief
                </button>
                <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setEditing(client); setShowModal(true); }}>
                  Editar
                </button>
                <button className="btn btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); handleDelete(client); }}>
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditing(null); }}
        title={editing ? `Editar: ${editing.name}` : 'Nuevo cliente'}
        maxWidth={640}
      >
        <ClientForm
          initial={editing || EMPTY_CLIENT}
          onSave={handleSave}
          onCancel={() => { setShowModal(false); setEditing(null); }}
        />
      </Modal>
    </div>
  );
}
