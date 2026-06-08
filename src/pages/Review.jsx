import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import Modal from '../components/Modal';

const TYPE_ICONS  = { carousel: '▦', reel: '▷', static: '□', story: '◻' };
const TYPE_LABELS = { carousel: 'Carrusel', reel: 'Reel', static: 'Estático', story: 'Story' };
const TYPES       = ['carousel', 'reel', 'static', 'story'];
const PLATFORMS   = ['instagram', 'tiktok', 'linkedin', 'facebook', 'youtube'];
const STATUS_META = {
  pending:   { label: 'Pendiente',  color: '#a1a1aa' },
  review:    { label: 'En revisión', color: '#f59e0b' },
  approved:  { label: 'Aprobado',   color: '#10b981' },
  published: { label: 'Publicado',  color: '#6366f1' },
};

/* ── Helpers ─────────────────────────────────────────────────── */

function movePost(posts, postId, targetWeek, insertBeforeId) {
  const moved = { ...posts.find((p) => p.id === postId), week: targetWeek };
  const rest  = posts.filter((p) => p.id !== postId);

  if (insertBeforeId === null) {
    // Append after the last post of targetWeek
    let lastIdx = -1;
    rest.forEach((p, i) => { if (p.week === targetWeek) lastIdx = i; });
    lastIdx === -1 ? rest.push(moved) : rest.splice(lastIdx + 1, 0, moved);
  } else {
    const idx = rest.findIndex((p) => p.id === insertBeforeId);
    idx === -1 ? rest.push(moved) : rest.splice(idx, 0, moved);
  }
  return rest;
}

/* ── Sub-components ───────────────────────────────────────────── */

function DropLine() {
  return (
    <div style={{
      height: 3, borderRadius: 2,
      background: 'var(--gradient-main)',
      boxShadow: '0 0 10px rgba(99,102,241,0.55)',
      margin: '2px 0',
    }} />
  );
}

function PostCard({ post, isDragging, onDragStart, onDragEnd, onDragOver, onClick }) {
  const statusColor = STATUS_META[post.status]?.color || STATUS_META.pending.color;
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onClick={onClick}
      style={{
        background: '#fff',
        border: '1px solid var(--color-border)',
        borderLeft: `3px solid ${statusColor}`,
        borderRadius: 'var(--radius-lg)',
        padding: '12px 14px',
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.3 : 1,
        transition: 'opacity 0.12s, box-shadow 0.15s, transform 0.15s',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        if (isDragging) return;
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Type + status dot */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ color: 'var(--color-primary)', fontSize: 11 }}>{TYPE_ICONS[post.type] || '□'}</span>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {TYPE_LABELS[post.type] || post.type}
          </span>
        </div>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
      </div>

      {/* Title */}
      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, lineHeight: 1.35, marginBottom: 5 }}>
        {post.title || post.topic}
      </div>

      {/* Copy preview */}
      {post.copy && (
        <div style={{
          fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {post.copy}
        </div>
      )}

      {/* Assigned */}
      {post.assignedTo && (
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{
            width: 16, height: 16, borderRadius: '50%',
            background: 'var(--gradient-main)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 8, fontWeight: 800, flexShrink: 0,
          }}>
            {post.assignedTo[0]?.toUpperCase()}
          </div>
          <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{post.assignedTo}</span>
        </div>
      )}
    </div>
  );
}

/* ── AI section replacement helper ───────────────────────────── */

function replaceSectionInCopy(copy, sectionName, newContent) {
  const upper = sectionName.toUpperCase().trim();
  // Split by blank lines — each block is one section
  const blocks = copy.split(/\n\n+/);
  let found = false;

  const newBlocks = blocks.map((block) => {
    const firstLine = block.split('\n')[0];
    const headerMatch = firstLine.match(/^([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s\d]+):/i);
    if (headerMatch && headerMatch[1].toUpperCase().trim() === upper) {
      found = true;
      return `${headerMatch[1].toUpperCase()}:\n${newContent.trim()}`;
    }
    return block;
  });

  return found ? newBlocks.join('\n\n') : null;
}

/* ── Edit Modal ───────────────────────────────────────────────── */

const normalizeSlide = (s) => {
  if (!s) return { titulo: '', texto: '' };
  if (typeof s === 'string') return { titulo: s, texto: '' };
  return { titulo: s.titulo || s.title || '', texto: s.texto || s.text || s.content || '' };
};

function EditModal({ post, onClose, onSave }) {
  const [form, setForm] = useState({
    ...post,
    slides: (post.slides || []).map(normalizeSlide),
  });
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const fs = { fontSize: 'var(--text-sm)', padding: '8px 12px' };

  const [aiInstruction, setAiInstruction] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const handleAiAdjust = async () => {
    if (!aiInstruction.trim()) return;

    setAiLoading(true);
    setAiError('');

    const currentTitle = form.title || '';
    const currentCopy  = form.copy  || '';

    // Ask Claude to identify WHICH section to change and return ONLY that section's new content.
    // We then splice it back ourselves — Claude never sees or touches the rest of the copy.
    const prompt = `Eres un editor de social media. Esta es la tarjeta:

TÍTULO: ${currentTitle}

${currentCopy}

---
INSTRUCCIÓN DEL USUARIO: "${aiInstruction.trim()}"

Tu tarea es identificar qué sección específica debe cambiar y devolver SOLO el nuevo contenido de esa sección.

Responde con JSON puro (sin markdown ni bloques de código):
- Si debes cambiar el TÍTULO: {"target":"title","newContent":"nuevo título aquí"}
- Si debes cambiar una SECCIÓN del copy (COPY, HASHTAGS, SLIDE 2, SLIDE 3, PORTADA, TITULAR, PÁRRAFO, BRIEF DISEÑADOR, VOZ EN OFF, etc.):
  {"target":"NOMBRE_EXACTO_DE_SECCIÓN_SIN_DOS_PUNTOS","newContent":"nuevo contenido de esa sección sin incluir el nombre de la sección"}

IMPORTANTE: "newContent" contiene SOLO el cuerpo de la sección, no el encabezado.`;

    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${res.status}`);
      }

      // Read SSE stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = '';
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const d = line.slice(6).trim();
          if (d === '[DONE]') continue;
          try {
            const ev = JSON.parse(d);
            if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') text += ev.delta.text;
          } catch {}
        }
      }

      let jsonStr = null;
      const md = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (md) jsonStr = md[1].trim();
      else {
        const a = text.indexOf('{'), b = text.lastIndexOf('}');
        if (a !== -1 && b > a) jsonStr = text.slice(a, b + 1);
      }

      if (!jsonStr) throw new Error('Respuesta inesperada de Claude');
      const { target, newContent } = JSON.parse(jsonStr);
      if (!target || newContent === undefined) throw new Error('Respuesta incompleta de Claude');

      if (target === 'title') {
        setForm((f) => ({ ...f, title: newContent }));
      } else {
        // Splice new content into the specific section; everything else stays untouched
        const updatedCopy = replaceSectionInCopy(currentCopy, target, newContent);
        if (updatedCopy === null) {
          throw new Error(`Sección "${target}" no encontrada. Intenta con el nombre exacto como aparece en el contenido.`);
        }
        setForm((f) => ({ ...f, copy: updatedCopy }));
      }

      setAiInstruction('');
    } catch (err) {
      setAiError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Row 1 — Status */}
      <div style={{ display: 'flex', gap: 6 }}>
        {Object.entries(STATUS_META).map(([st, { label, color }]) => (
          <button key={st} type="button"
            onClick={() => setForm((f) => ({ ...f, status: st }))}
            style={{
              padding: '4px 14px', borderRadius: 100,
              border: `1.5px solid ${form.status === st ? color : 'var(--color-border)'}`,
              background: form.status === st ? color + '15' : 'transparent',
              color: form.status === st ? color : 'var(--color-text-muted)',
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
            }}
          >{label}</button>
        ))}
      </div>

      {/* Row 2 — Meta */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 1fr 1fr', gap: 8 }}>
        <select className="input-field" value={form.type || 'static'} onChange={set('type')} style={fs}>
          {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
        </select>
        <select className="input-field" value={form.week || 1} onChange={(e) => setForm((f) => ({ ...f, week: Number(e.target.value) }))} style={fs}>
          {[1,2,3,4].map((w) => <option key={w} value={w}>Sem. {w}</option>)}
        </select>
        <select className="input-field" value={form.platform || 'instagram'} onChange={set('platform')} style={fs}>
          {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <input className="input-field" value={form.assignedTo || ''} onChange={set('assignedTo')} placeholder="Responsable" style={fs} />
      </div>

      <div style={{ height: 1, background: 'var(--color-border-light)' }} />

      {/* Title */}
      <input
        className="input-field"
        value={form.title || ''}
        onChange={set('title')}
        placeholder="Título del post"
        style={{ fontWeight: 700, fontSize: 'var(--text-md)', padding: '9px 12px' }}
      />

      {/* Content */}
      <textarea
        className="input-field"
        value={form.copy || ''}
        onChange={set('copy')}
        rows={9}
        placeholder="Contenido del post..."
        style={{ resize: 'vertical', lineHeight: 1.75, fontSize: 'var(--text-sm)', padding: '12px' }}
      />

      {/* ── AI inline edit ── */}
      <div style={{
        background: 'var(--color-primary-light)',
        border: '1px solid #c7d2fe',
        borderRadius: 'var(--radius-md)',
        padding: '10px 12px',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="input-field"
            value={aiInstruction}
            onChange={(e) => setAiInstruction(e.target.value)}
            placeholder="Pídele a Claude que ajuste esta tarjeta..."
            style={{ flex: 1, fontSize: 'var(--text-sm)', padding: '7px 12px', background: '#fff' }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAiAdjust(); } }}
            disabled={aiLoading}
            autoComplete="new-password"
            data-form-type="other"
          />
          <button
            type="button"
            onClick={handleAiAdjust}
            disabled={aiLoading || !aiInstruction.trim()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              background: (aiLoading || !aiInstruction.trim()) ? '#c7d2fe' : 'var(--gradient-main)',
              color: '#fff',
              fontSize: 12, fontWeight: 700, cursor: (aiLoading || !aiInstruction.trim()) ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap', flexShrink: 0,
              transition: 'opacity 0.15s',
            }}
          >
            {aiLoading
              ? <><div className="spinner" style={{ width: 12, height: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Ajustando...</>
              : '✨ Ajustar con IA'
            }
          </button>
        </div>
        {aiError && (
          <div style={{ fontSize: 11, color: 'var(--color-danger)', fontFamily: 'var(--font-mono)' }}>{aiError}</div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => onSave(post.id, form)}>Guardar</button>
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */

export default function Review() {
  const navigate = useNavigate();
  const { activePlanning, updateActivePlanningPost, setActivePlanningPosts, clearActivePlanning, savePlanning, history, addToast } = useStore();
  const isFromHistory = history.some((h) => h.id === activePlanning?.id);

  const [selectedPost,  setSelectedPost]  = useState(null);
  const [filterType,    setFilterType]    = useState('all');
  const [filterStatus,  setFilterStatus]  = useState('all');

  // DnD
  const [draggingId,    setDraggingId]    = useState(null);
  const [dragOverWeek,  setDragOverWeek]  = useState(null);
  const [insertBeforeId, setInsertBefore] = useState(null); // null = append to end of week

  if (!activePlanning) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">▦</div>
          <div className="empty-state-title">Sin planificación activa</div>
          <div className="empty-state-desc">Genera una planificación primero desde la sección de Planificación</div>
          <button className="btn btn-gradient" onClick={() => navigate('/planning')} style={{ borderRadius: 100 }}>Ir a Planificación</button>
        </div>
      </div>
    );
  }

  const allPosts = activePlanning.posts || [];

  // While dragging, show all posts so every column is a valid drop target
  const displayPosts = draggingId
    ? allPosts
    : allPosts.filter((p) => {
        if (filterType   !== 'all' && p.type   !== filterType)   return false;
        if (filterStatus !== 'all' && p.status !== filterStatus) return false;
        return true;
      });

  const handleDrop = (targetWeek) => {
    if (!draggingId) return;
    setActivePlanningPosts(movePost(allPosts, draggingId, targetWeek, insertBeforeId));
    setDraggingId(null);
    setDragOverWeek(null);
    setInsertBefore(null);
  };

  const handlePostSave = (postId, updates) => {
    updateActivePlanningPost(postId, updates);
    setSelectedPost(null);
    addToast({ type: 'success', message: 'Post actualizado' });
  };

  return (
    <div className="page-container" style={{ maxWidth: 1200 }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Revisión</h1>
          <p className="page-subtitle">{activePlanning.clientName} · {activePlanning.month} · {allPosts.length} posts</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => {
              if (!confirm(`¿Eliminar la planificación de ${activePlanning.clientName} · ${activePlanning.month}?\n\nEsta acción no se puede deshacer.`)) return;
              clearActivePlanning();
              addToast({ type: 'warning', message: 'Planificación eliminada' });
              navigate('/planning');
            }}
          >
            🗑 Eliminar
          </button>

          {isFromHistory ? (
            <button
              className="btn btn-secondary"
              onClick={() => {
                savePlanning(activePlanning);
                clearActivePlanning();
                addToast({ type: 'success', message: 'Cambios guardados en Historial' });
                navigate('/history');
              }}
            >
              ◈ Guardar y volver al Historial
            </button>
          ) : (
            <button
              className="btn btn-secondary"
              onClick={() => {
                savePlanning(activePlanning);
                addToast({ type: 'success', message: 'Guardado en historial' });
              }}
            >
              Guardar en historial
            </button>
          )}

          <button className="btn btn-gradient" onClick={() => navigate('/publish')} style={{ borderRadius: 100 }}>Subir a Trello</button>
        </div>
      </div>

      {/* Filters — se atenúan mientras se arrastra */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', opacity: draggingId ? 0.35 : 1, transition: 'opacity 0.2s', pointerEvents: draggingId ? 'none' : 'auto' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'carousel', 'reel', 'static', 'story'].map((t) => (
            <button key={t} onClick={() => setFilterType(t)} style={{
              padding: '5px 12px', borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--color-border)',
              background: filterType === t ? 'var(--color-primary)' : 'var(--color-surface)',
              color: filterType === t ? '#fff' : 'var(--color-text-secondary)',
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
            }}>
              {t === 'all' ? 'Todos' : TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <div style={{ width: 1, background: 'var(--color-border)', margin: '0 4px' }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {Object.entries(STATUS_META).map(([s, { label }]) => (
            <button key={s} onClick={() => setFilterStatus(filterStatus === s ? 'all' : s)} style={{
              padding: '5px 12px', borderRadius: 'var(--radius-pill)',
              border: `1px solid ${filterStatus === s ? STATUS_META[s].color : 'var(--color-border)'}`,
              background: filterStatus === s ? STATUS_META[s].color + '15' : 'transparent',
              color: filterStatus === s ? STATUS_META[s].color : 'var(--color-text-secondary)',
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
            }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Hint */}
      {allPosts.length > 0 && (
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 14, fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ opacity: 0.5 }}>⠿</span> Arrastra para mover entre semanas · Clic para editar
        </div>
      )}

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[1, 2, 3, 4].map((week) => {
          const weekPosts = displayPosts.filter((p) => p.week === week);
          const isOver    = dragOverWeek === week;

          return (
            <div
              key={week}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverWeek(week);
                // Only fires when over the empty column area (cards stop propagation)
                setInsertBefore(null);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                  setDragOverWeek((prev) => (prev === week ? null : prev));
                }
              }}
              onDrop={(e) => { e.preventDefault(); handleDrop(week); }}
              style={{
                borderRadius: 'var(--radius-lg)',
                border: `2px dashed ${isOver ? 'var(--color-primary)' : 'transparent'}`,
                background: isOver ? 'var(--color-primary-light)' : 'transparent',
                padding: isOver ? 8 : 0,
                transition: 'all 0.15s ease',
                minHeight: 160,
              }}
            >
              {/* Column header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 10, paddingBottom: 8,
                borderBottom: `2px solid ${isOver ? 'var(--color-primary)' : '#e4e4e7'}`,
                transition: 'border-color 0.15s',
              }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: isOver ? 'var(--color-primary)' : 'var(--color-text)' }}>
                  Semana {week}
                </span>
                <span className={`badge ${isOver ? 'badge-primary' : 'badge-muted'}`}>{weekPosts.length}</span>
              </div>

              {/* Cards with drop indicators */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {weekPosts.map((post, idx) => {
                  const weekIds   = weekPosts.map((p) => p.id);
                  const nextId    = weekIds[idx + 1] ?? null;
                  const isLast    = idx === weekIds.length - 1;

                  return (
                    <div key={post.id}>
                      {/* Line ABOVE this card */}
                      {draggingId && draggingId !== post.id && insertBeforeId === post.id && isOver && (
                        <DropLine />
                      )}

                      <div style={{ marginBottom: 8 }}>
                        <PostCard
                          post={post}
                          isDragging={draggingId === post.id}
                          onClick={() => { if (!draggingId) setSelectedPost({ ...post }); }}
                          onDragStart={(e) => {
                            setDraggingId(post.id);
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('text/plain', post.id);
                          }}
                          onDragEnd={() => {
                            setDraggingId(null);
                            setDragOverWeek(null);
                            setInsertBefore(null);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation(); // prevent column handler from overriding
                            if (draggingId === post.id) return;
                            const rect   = e.currentTarget.getBoundingClientRect();
                            const isAbove = e.clientY < rect.top + rect.height / 2;
                            setDragOverWeek(week);
                            setInsertBefore(isAbove ? post.id : nextId);
                          }}
                        />
                      </div>

                      {/* Line AFTER last card when inserting at end */}
                      {isLast && draggingId && draggingId !== post.id && insertBeforeId === null && isOver && (
                        <DropLine />
                      )}
                    </div>
                  );
                })}

                {/* Empty column states */}
                {weekPosts.length === 0 && (
                  isOver ? (
                    <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--color-primary)', fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      Soltar aquí
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--color-text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                      Sin posts
                    </div>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit modal */}
      <Modal
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        title={selectedPost?.title || selectedPost?.topic || 'Editar post'}
        maxWidth={680}
      >
        {selectedPost && (
          <EditModal
            post={selectedPost}
            onClose={() => setSelectedPost(null)}
            onSave={handlePostSave}
          />
        )}
      </Modal>
    </div>
  );
}
