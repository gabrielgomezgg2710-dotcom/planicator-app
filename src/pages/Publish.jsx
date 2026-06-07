import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';

const CARD_TYPE_LABEL = { carousel: 'Carrusel', reel: 'Reel', static: 'Post', story: 'Story' };

/* ── Trello API helpers ───────────────────────────────────────── */

async function trelloGet(path, { apiKey, token }) {
  const res = await fetch(`https://api.trello.com/1${path}?key=${apiKey}&token=${token}`);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Trello ${res.status}: ${text || path}`);
  }
  return res.json();
}

async function trelloPost(path, body, { apiKey, token }) {
  const params = new URLSearchParams({ key: apiKey, token, ...body });
  const res = await fetch(`https://api.trello.com/1${path}?${params}`, { method: 'POST' });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Trello ${res.status}: ${text || path}`);
  }
  return res.json();
}

// Finds existing open list or creates a new one
async function findOrCreateList({ apiKey, token, boardId, name }) {
  const lists = await trelloGet(`/boards/${boardId}/lists`, { apiKey, token });
  const existing = lists.find((l) => l.name === name && !l.closed);
  if (existing) return { list: existing, created: false };
  const list = await trelloPost('/lists', { name, idBoard: boardId }, { apiKey, token });
  return { list, created: true };
}

async function createCard({ apiKey, token, listId, name, desc }) {
  return trelloPost('/cards', { idList: listId, name, desc }, { apiKey, token });
}

// Assign a single member to a card (separate call, best-effort)
async function assignCardMember({ apiKey, token, cardId, memberId }) {
  try {
    const params = new URLSearchParams({ key: apiKey, token, value: memberId });
    await fetch(`https://api.trello.com/1/cards/${cardId}/idMembers?${params}`, { method: 'POST' });
  } catch {
    // assignment failure is non-fatal
  }
}

// Match a post to the right board member based on type
function resolveAssignee(post, members) {
  if (!members?.length) return null;

  const clean = (u) => (u || '').replace(/^@+/, '').toLowerCase().trim();

  // Try direct username match on post.assignedTo
  if (post.assignedTo) {
    const target = clean(post.assignedTo);
    const byUsername = members.find((m) => clean(m.username) === target);
    if (byUsername) return byUsername;

    const byName = members.find((m) =>
      m.fullName?.toLowerCase().includes(target) ||
      target.includes(clean(m.username))
    );
    if (byName) return byName;
  }

  // Type-based fallback
  if (post.type === 'reel') {
    // Video editors
    const editorUsernames = ['isleyerfajardo'];
    const editor = members.find((m) => editorUsernames.includes(clean(m.username)));
    if (editor) return editor;
  } else {
    // Designers for everything else (post, carousel, story)
    const designerUsernames = ['gabrielgomez96', 'sofiaramos113'];
    const designer = members.find((m) => designerUsernames.includes(clean(m.username)));
    if (designer) return designer;
  }

  return null;
}

/* ── Page ─────────────────────────────────────────────────────── */

export default function Publish() {
  const navigate  = useNavigate();
  const { activePlanning, trelloApiKey, trelloToken, clients, savePlanning, clearActivePlanning, addToast } = useStore();

  const [publishing, setPublishing] = useState(false);
  const [progress,   setProgress]   = useState([]);

  const client   = clients.find((c) => c.id === activePlanning?.clientId);
  const boardId  = client?.trelloBoardId;
  const posts    = activePlanning?.posts || [];

  const missingKeys  = !trelloApiKey || !trelloToken;
  const missingBoard = !boardId;

  const log = (msg, type = 'info') =>
    setProgress((p) => [...p, { msg, type, time: new Date().toLocaleTimeString() }]);

  const handlePublish = async () => {
    if (!activePlanning) return addToast({ type: 'error', message: 'Sin planificación activa' });
    if (missingKeys)     return addToast({ type: 'error', message: 'Configura las API keys de Trello en Ajustes' });
    if (missingBoard)    return addToast({ type: 'error', message: 'El cliente no tiene Trello Board ID configurado' });

    setPublishing(true);
    setProgress([]);

    const creds    = { apiKey: trelloApiKey, token: trelloToken };
    const listName = activePlanning.month; // e.g. "Junio 2026"

    try {
      // 1 — Verify board + get members
      log('Verificando acceso al tablero...');
      const members = await trelloGet(`/boards/${boardId}/members`, creds).catch(() => []);
      log(`Tablero OK · ${members.length} miembro${members.length !== 1 ? 's' : ''}`, 'success');


      if (members.length > 0) {
        const names = members.map((m) => `${m.username}`).join(', ');
        log(`Miembros: ${names}`);
      }

      // 2 — Find or create the single month list
      log(`Buscando lista "${listName}"...`);
      const { list, created } = await findOrCreateList({ ...creds, boardId, name: listName });
      log(created ? `Lista "${listName}" creada ✓` : `Lista "${listName}" encontrada ✓`, 'success');

      // 3 — Create cards + assign members
      let assigned = 0;
      for (const post of posts) {
        const typeLabel = CARD_TYPE_LABEL[post.type] || 'Post';
        const dateStr   = post.date || `S${post.week}`;
        const cardName  = `${typeLabel} ${dateStr}`;

        const desc = [
          post.titular     && `*Titular:* ${post.titular}`,
          post.parrafo     && `*Párrafo:* ${post.parrafo}`,
          post.copy        && `\n*Copy:*\n${post.copy}`,
          post.voiceover   && `\n*Guión voz en off:*\n${post.voiceover}`,
          post.slides?.length > 0 && `\n*Slides:*\n${post.slides.map((s, i) => {
            if (typeof s === 'string') return `${i + 1}. ${s}`;
            return `${i + 1}. ${s.titulo || ''} — ${s.texto || ''}`;
          }).join('\n')}`,
          post.designBrief && `\n*Brief diseño:*\n${post.designBrief}`,
          post.editorBrief && `\n*Brief edición:*\n${post.editorBrief}`,
        ].filter(Boolean).join('\n');

        const card = await createCard({ ...creds, listId: list.id, name: cardName, desc });
        log(`✓ ${cardName}`, 'success');

        // Assign member
        const member = resolveAssignee(post, members);
        if (member) {
          await assignCardMember({ ...creds, cardId: card.id, memberId: member.id });
          assigned++;
          log(`  → asignado a @${member.username}`, 'success');
        }

        await new Promise((r) => setTimeout(r, 180));
      }

      // Auto-save to history, clear Review, redirect
      savePlanning({ ...activePlanning, publishedAt: new Date().toISOString() });
      clearActivePlanning();
      addToast({
        type: 'success',
        title: '¡Subido a Trello!',
        message: `${posts.length} tarjetas subidas y guardadas en Historial`,
      });
      navigate('/history');

    } catch (err) {
      console.error('[Trello] Error al publicar:', err);
      log(`✕ ${err.message}`, 'error');
      addToast({ type: 'error', title: 'Error Trello', message: err.message });
    } finally {
      setPublishing(false);
    }
  };

  if (!activePlanning) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">⬆</div>
          <div className="empty-state-title">Sin planificación activa</div>
          <div className="empty-state-desc">Genera o carga una planificación antes de subir a Trello</div>
          <button className="btn btn-gradient" onClick={() => navigate('/planning')} style={{ borderRadius: 100 }}>Ir a Planificación</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: 700 }}>
      <div className="page-header">
        <h1 className="page-title">Subir a Trello</h1>
        <p className="page-subtitle">{activePlanning.clientName} · {activePlanning.month}</p>
      </div>

      {/* Warnings */}
      {(missingKeys || missingBoard) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {missingKeys && (
            <div style={{ background: 'var(--color-warning-light)', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: 'var(--text-sm)', display: 'flex', gap: 8, alignItems: 'center' }}>
              ⚠ Configura las API keys de Trello en{' '}
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/settings')} style={{ padding: '0 6px', fontSize: 12 }}>Ajustes →</button>
            </div>
          )}
          {missingBoard && client && (
            <div style={{ background: 'var(--color-warning-light)', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: 'var(--text-sm)', display: 'flex', gap: 8, alignItems: 'center' }}>
              ⚠ <strong>{client.name}</strong> no tiene Trello Board ID.{' '}
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/clients')} style={{ padding: '0 6px', fontSize: 12 }}>Configurar →</button>
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: 16 }}>Resumen</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-primary)' }}>{posts.length}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>tarjetas</div>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-secondary)', paddingTop: 6, lineHeight: 1.2 }}>{activePlanning.month}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 4 }}>1 lista en Trello</div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-accent)', fontFamily: 'var(--font-mono)', paddingTop: 6 }}>
              {boardId ? `${boardId.slice(0, 10)}…` : '—'}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 4 }}>board ID</div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: 14 }}>
          Vista previa · lista <span style={{ color: 'var(--color-primary)' }}>"{activePlanning.month}"</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 280, overflowY: 'auto' }}>
          {posts.map((p) => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '7px 10px',
              background: 'var(--color-bg)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-sm)',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-primary)', fontWeight: 700, minWidth: 72, flexShrink: 0 }}>
                {CARD_TYPE_LABEL[p.type] || 'Post'} {p.date || `S${p.week}`}
              </span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text-secondary)' }}>
                {p.title || p.topic}
              </span>
              {p.assignedTo && (
                <span style={{ fontSize: 10, color: 'var(--color-text-muted)', flexShrink: 0 }}>→ {p.assignedTo}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Log */}
      {progress.length > 0 && (
        <div style={{
          background: '#0d0d14', borderRadius: 'var(--radius-lg)',
          border: '1px solid #1f2937', padding: '14px 16px', marginBottom: 24,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
            Log
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 260, overflowY: 'auto' }}>
            {progress.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: '#374151', flexShrink: 0 }}>{p.time}</span>
                <span style={{ color: p.type === 'success' ? '#10b981' : p.type === 'error' ? '#ef4444' : '#6b7280' }}>
                  {p.msg}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        className="btn btn-gradient btn-lg"
        onClick={handlePublish}
        disabled={publishing || missingKeys || missingBoard}
        style={{
          borderRadius: 100,
          opacity: (publishing || missingKeys || missingBoard) ? 0.6 : 1,
          cursor: (publishing || missingKeys || missingBoard) ? 'not-allowed' : 'pointer',
        }}
      >
        {publishing
          ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Publicando...</>
          : `Subir a lista "${activePlanning.month}"`
        }
      </button>
    </div>
  );
}
