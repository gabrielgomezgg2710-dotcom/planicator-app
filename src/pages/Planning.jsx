import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useStore from '../store/useStore';
import ClientAvatar from '../components/ClientAvatar';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const POST_TYPES = [
  { id: 'carousel', label: 'Carrusel', icon: '▦' },
  { id: 'reel', label: 'Reel / Video', icon: '▷' },
  { id: 'static', label: 'Post estático', icon: '□' },
  { id: 'story', label: 'Story', icon: '◻' },
];

/* ── JSON sanitizer — escapes literal newlines inside string values ── */
function sanitizeJsonStrings(json) {
  let result = '', inString = false, i = 0;
  while (i < json.length) {
    const c = json[i];
    if (inString) {
      if (c === '\\') { result += c + (json[i + 1] ?? ''); i += 2; continue; }
      else if (c === '"') { inString = false; result += c; }
      else if (c === '\n') { result += '\\n'; }
      else if (c === '\r') { result += '\\r'; }
      else if (c === '\t') { result += '\\t'; }
      else { result += c; }
    } else {
      if (c === '"') inString = true;
      result += c;
    }
    i++;
  }
  return result;
}

/* ── Date helpers ─────────────────────────────────────────────── */

function getPostingDates(monthName, year) {
  const idx = MONTHS.indexOf(monthName);
  if (idx === -1) return [];
  const dates = [];
  const d = new Date(year, idx, 1);
  while (d.getMonth() === idx) {
    const day = d.getDay();
    if (day === 1 || day === 3 || day === 5) dates.push(new Date(d)); // Mon Wed Fri
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function fmtDate(d) {
  return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getFullYear()).slice(-2)}`;
}

function assignPostDates(posts, monthName, year) {
  const allDates = getPostingDates(monthName, year);
  if (!allDates.length) return posts;

  const perWeek = Math.ceil(allDates.length / 4);
  const weekDates = { 1: allDates.slice(0, perWeek), 2: allDates.slice(perWeek, perWeek*2), 3: allDates.slice(perWeek*2, perWeek*3), 4: allDates.slice(perWeek*3) };

  // Track index within each week
  const weekIdx = { 1: 0, 2: 0, 3: 0, 4: 0 };
  return posts.map((p) => {
    const w = p.week || 1;
    const dates = weekDates[w] || [];
    const date = dates[weekIdx[w] % (dates.length || 1)];
    weekIdx[w]++;
    return { ...p, date: date ? fmtDate(date) : null };
  });
}

/* ── Prompt builder ───────────────────────────────────────────── */

function buildPrompt(client, month, year, topicsText, distribution) {
  const teamStr = [
    client.teamDesign && `Diseño: ${client.teamDesign}`,
    client.teamCopy && `Copy: ${client.teamCopy}`,
    client.teamVideo && `Video: ${client.teamVideo}`,
    client.teamSocial && `Social: ${client.teamSocial}`,
  ].filter(Boolean).join(', ');

  const contextStr = client.contextText || [
    client.businessDesc && `Descripción: ${client.businessDesc}`,
    client.tone && `Tono: ${client.tone}`,
    client.audience && `Público objetivo: ${client.audience}`,
    client.differentiators && `Diferenciadores: ${client.differentiators}`,
  ].filter(Boolean).join('\n') || 'Sin contexto adicional';

  const total = Object.values(distribution).reduce((a, b) => a + b, 0);

  return `Eres un experto en social media para agencias. REGLA ABSOLUTA: TODO el contenido debe estar completamente redactado — PROHIBIDO dejar campos vacíos, usar corchetes o placeholders.

CLIENTE: ${client.name}${client.industry ? ` | ${client.industry}` : ''}
CONTEXTO: ${contextStr}
MES: ${month} ${year}
TEMAS: ${topicsText}
EQUIPO: ${teamStr || 'Sin asignar'}

DISTRIBUCIÓN (genera EXACTAMENTE):
Posts estáticos: ${distribution.static} | Carruseles: ${distribution.carousel} | Reels: ${distribution.reel} | Stories: ${distribution.story} | TOTAL: ${total}

━━ REGLAS DEL CAMPO "copy" ━━

El campo "copy" contiene TODO el contenido del post. Usa este formato según el tipo:

TYPE static o story → copy debe tener:
COPY: [3 líneas con emojis y CTA]
HASHTAGS: [7 hashtags]
TITULAR: [máx 6 palabras para el diseño]
PÁRRAFO: [máx 12 palabras de apoyo para el diseño]
BRIEF DISEÑADOR: [colores hex, tipo de imagen, composición, logo]

TYPE reel → copy debe tener:
COPY: [3 líneas con emojis y CTA]
HASHTAGS: [7 hashtags]
VOZ EN OFF: [guión 60-80 palabras, listo para leer]
OVERLAYS: 1.[texto] 2.[texto] 3.[texto] 4.[texto]
BRIEF EDITOR: [tomas en orden, duración clips, música, ritmo]

TYPE carousel → copy debe tener:
COPY: [3 líneas con emojis y CTA]
HASHTAGS: [7 hashtags]
PORTADA: [título portada máx 6 palabras]
SLIDE 2: [título] | [texto 1-2 oraciones]
SLIDE 3: [título] | [texto 1-2 oraciones]
SLIDE 4: [título] | [texto 1-2 oraciones]
SLIDE 5: [título] | [texto 1-2 oraciones]
SLIDE FINAL: [CTA + contacto WhatsApp]
BRIEF DISEÑADOR: [colores hex, estilo, composición por slide]

━━ JSON ━━
Responde SOLO con JSON puro, sin markdown. "title" = título del post (4-6 palabras, NUNCA vacío). "copy" = todo el contenido según formato arriba.

{"posts":[{"id":"post_1","week":1,"type":"static","title":"Bienvenidos a junio","copy":"COPY:\\n💊 Tu salud es nuestra prioridad.\\nEn Farmacia Santa Rosa tenemos todo.\\n¿Nos visitas hoy? 🤝\\n\\nHASHTAGS:\\n#FarmaciaSantaRosa #Salud #Barquisimeto #Farmacia #Bienestar #Medicamentos #TuFarmacia\\n\\nTITULAR:\\nTu salud, nuestra misión\\n\\nPÁRRAFO:\\nMedicamentos de calidad al mejor precio de la ciudad\\n\\nBRIEF DISEÑADOR:\\nFondo blanco, tipografía Montserrat Bold, foto de farmacéutico atendiendo, logo arriba derecha, borde verde #2ECC71","assignedTo":"gabrielgomez96","platform":"instagram","status":"pending"}]}`;
}

export default function Planning() {
  const navigate = useNavigate();
  const location = useLocation();
  const { clients, claudeApiKey, setActivePlanning, addToast } = useStore();

  const now = new Date();
  const [clientId, setClientId] = useState(location.state?.clientId || (clients[0]?.id || ''));
  const [month, setMonth] = useState(MONTHS[now.getMonth()]);
  const [year, setYear] = useState(now.getFullYear());
  const [topics, setTopics] = useState('');
  const [distribution, setDistribution] = useState({ carousel: 4, reel: 3, static: 2, story: 2 });
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [rawError, setRawError] = useState('');

  const client = clients.find((c) => c.id === clientId);
  const totalPosts = Object.values(distribution).reduce((a, b) => a + b, 0);

  const handleGenerate = async () => {
    if (!client) return addToast({ type: 'error', message: 'Selecciona un cliente' });
    if (!claudeApiKey) return addToast({ type: 'error', message: 'Configura tu API key de Claude en Ajustes', title: 'API Key requerida' });
    if (!topics.trim()) return addToast({ type: 'error', message: 'Escribe al menos un tema del mes' });

    setLoading(true);
    setRawError('');
    setProgress('Conectando con Claude AI...');

    const requestBody = {
      model: 'claude-sonnet-4-6',
      max_tokens: 16000,
      messages: [{ role: 'user', content: buildPrompt(client, month, year, topics.trim(), distribution) }],
    };

    console.log('[Planicator] Claude request body:', requestBody);

    try {
      setProgress('Generando contenido... (30-60 seg)');

      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error?.message || `HTTP ${res.status}`);
      }

      // Read SSE stream from proxy (buffered to handle lines split across chunks)
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete last line
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const event = JSON.parse(data);
            if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
              text += event.delta.text;
            }
          } catch {}
        }
      }

      setProgress('Procesando respuesta...');

      // Extract JSON: try markdown code block first, then bare object
      let jsonStr = null;
      const mdMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (mdMatch) {
        jsonStr = mdMatch[1].trim();
        console.log('[Planicator] Extracted from markdown block');
      } else {
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end > start) {
          jsonStr = text.slice(start, end + 1);
          console.log('[Planicator] Extracted bare JSON object');
        }
      }

      if (!jsonStr) {
        console.error('[Planicator] No JSON found in:', text);
        setRawError(text.slice(0, 500));
        throw new Error('No se encontró JSON en la respuesta. Ver consola para el texto raw.');
      }

      let parsed;
      try {
        parsed = JSON.parse(sanitizeJsonStrings(jsonStr));
        console.log('[Planicator] Parsed posts:', parsed.posts?.length);
      } catch (parseErr) {
        console.error('[Planicator] JSON.parse error:', parseErr.message);
        console.error('[Planicator] Attempted string (first 300 chars):', jsonStr.slice(0, 300));
        setRawError(`Parse error: ${parseErr.message}\n\nTexto recibido:\n${jsonStr.slice(0, 400)}`);
        throw new Error(`JSON inválido: ${parseErr.message}`);
      }

      if (!parsed.posts || !Array.isArray(parsed.posts)) {
        console.error('[Planicator] Missing posts array. Got:', Object.keys(parsed));
        throw new Error('La respuesta no contiene un array "posts"');
      }

      const rawPosts = parsed.posts.map((p, i) => ({ ...p, id: p.id || `post_${i + 1}` }));
      const datedPosts = assignPostDates(rawPosts, month, year);

      const planning = {
        id: Date.now().toString(),
        clientId: client.id,
        clientName: client.name,
        month: `${month} ${year}`,
        topics: topics.trim().split('\n').map((s) => s.trim()).filter(Boolean),
        distribution,
        posts: datedPosts,
        createdAt: new Date().toISOString(),
      };

      setActivePlanning(planning);
      addToast({ type: 'success', title: '¡Planificación generada!', message: `${planning.posts.length} posts para ${client.name}` });
      navigate('/review');
    } catch (err) {
      console.error('[Planicator] handleGenerate error:', err);
      addToast({ type: 'error', title: 'Error al generar', message: err.message });
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const hasContext = client && (client.contextText || client.businessDesc);

  return (
    <div className="page-container" style={{ maxWidth: 760 }}>
      <div className="page-header">
        <h1 className="page-title">Planificación mensual</h1>
        <p className="page-subtitle">Claude AI genera todo el contenido del mes</p>
      </div>

      {!claudeApiKey && (
        <div style={{
          background: 'var(--color-warning-light)', border: '1px solid #fde68a',
          borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 10, fontSize: 'var(--text-sm)',
        }}>
          <span>⚠</span>
          <span>Necesitas configurar tu <strong>API Key de Claude</strong> antes de generar.{' '}
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/settings')} style={{ padding: '2px 8px', fontSize: 12 }}>Configurar →</button>
          </span>
        </div>
      )}

      {/* Client & Month */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 'var(--text-md)', marginBottom: 16 }}>Cliente y período</div>
        <div className="planning-period-grid">
          <div className="input-group">
            <label className="input-label">Cliente</label>
            <select className="input-field" value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">Seleccionar cliente...</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Mes</label>
            <select className="input-field" value={month} onChange={(e) => setMonth(e.target.value)}>
              {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Año</label>
            <input className="input-field" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} min={2024} max={2030} />
          </div>
        </div>

        {/* Client preview */}
        {client && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 16px',
            background: 'var(--color-primary-light)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #c7d2fe',
          }}>
            <ClientAvatar client={client} size={44} radius={10} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>{client.name}</div>
              {hasContext ? (
                <div style={{
                  fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)',
                  marginTop: 2, lineHeight: 1.5,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {client.contextText || client.businessDesc}
                </div>
              ) : (
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-warning)', marginTop: 2 }}>
                  Sin contexto — Claude generará contenido genérico.{' '}
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => navigate(`/clients/${client.id}`)}
                    style={{ padding: '1px 6px', fontSize: 11 }}
                  >
                    Agregar contexto →
                  </button>
                </div>
              )}
            </div>
            {client.contextAudio && (
              <span title="Tiene nota de voz" style={{ fontSize: 16, opacity: 0.6 }}>🎙</span>
            )}
          </div>
        )}

        {clients.length === 0 && (
          <div style={{ marginTop: 12 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/clients')}>+ Crear primer cliente</button>
          </div>
        )}
      </div>

      {/* Topics */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 'var(--text-md)', marginBottom: 4 }}>Temas del mes</div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 14 }}>
          Claude usará esto como briefing de contenido para el mes
        </div>
        <textarea
          className="input-field"
          value={topics}
          onChange={(e) => setTopics(e.target.value)}
          rows={5}
          placeholder="Escribe aquí los temas, campañas y objetivos del mes..."
          style={{ resize: 'vertical', lineHeight: 1.65 }}
        />
      </div>

      {/* Distribution */}
      <div className="card" style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-md)' }}>Distribución de contenido</div>
          <span className="badge badge-primary">{totalPosts} posts totales</span>
        </div>
        <div className="distribution-grid">
          {POST_TYPES.map(({ id, label, icon }) => (
            <div key={id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'var(--color-bg)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--color-primary)', fontSize: 16 }}>{icon}</span>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setDistribution((d) => ({ ...d, [id]: Math.max(0, d[id] - 1) }))}
                  style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, background: 'var(--color-bg-alt)', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--color-text-secondary)' }}
                >−</button>
                <span style={{ width: 24, textAlign: 'center', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-md)' }}>{distribution[id]}</span>
                <button
                  type="button"
                  onClick={() => setDistribution((d) => ({ ...d, [id]: d[id] + 1 }))}
                  style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, background: 'var(--color-bg-alt)', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--color-text-secondary)' }}
                >+</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: rawError ? 16 : 0 }}>
        <button
          className="btn btn-gradient btn-lg"
          onClick={handleGenerate}
          disabled={loading || !clientId || !claudeApiKey}
          style={{
            borderRadius: 100,
            opacity: (loading || !clientId || !claudeApiKey) ? 0.6 : 1,
            cursor: (loading || !clientId || !claudeApiKey) ? 'not-allowed' : 'pointer',
          }}
        >
          {loading
            ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Generando...</>
            : '✨ Generar planificación con Claude'
          }
        </button>
        {loading && progress && (
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            {progress}
          </span>
        )}
      </div>

      {/* Raw error debug block */}
      {rawError && (
        <div style={{
          background: '#0d0d14', borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-danger)',
          padding: '14px 16px', marginTop: 8,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-danger)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 8 }}>
            Respuesta raw de Claude (ver también consola del navegador)
          </div>
          <pre style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
            {rawError}
          </pre>
        </div>
      )}
    </div>
  );
}
