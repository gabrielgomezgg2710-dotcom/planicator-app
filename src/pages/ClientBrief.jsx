import { useParams, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import ClientAvatar from '../components/ClientAvatar';

function TeamMember({ role, name }) {
  if (!name) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 14px',
      background: 'var(--color-bg)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--color-border-light)',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: 'var(--gradient-main)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0,
      }}>
        {name[0]?.toUpperCase()}
      </div>
      <div>
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{name}</div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{role}</div>
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 'var(--text-xs)', fontWeight: 700,
      color: 'var(--color-primary)',
      fontFamily: 'var(--font-mono)',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      marginBottom: 14,
    }}>
      {children}
    </div>
  );
}

export default function ClientBrief() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getClient } = useStore();
  const client = getClient(id);

  if (!client) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">◎</div>
          <div className="empty-state-title">Cliente no encontrado</div>
          <button className="btn btn-primary" onClick={() => navigate('/clients')}>Volver a Clientes</button>
        </div>
      </div>
    );
  }

  const hasTeam = client.teamDesign || client.teamCopy || client.teamVideo || client.teamSocial;
  const contextText = client.contextText || [
    client.businessDesc && `Descripción: ${client.businessDesc}`,
    client.tone && `Tono: ${client.tone}`,
    client.audience && `Público: ${client.audience}`,
    client.differentiators && `Diferenciadores: ${client.differentiators}`,
  ].filter(Boolean).join('\n\n');

  return (
    <div className="page-container" style={{ maxWidth: 780 }}>
      {/* Back */}
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/clients')} style={{ marginBottom: 24 }}>
        ← Volver
      </button>

      {/* ── Header card ── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <ClientAvatar client={client} size={72} radius={16} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                  {client.name}
                </h1>
                {client.industry && (
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                    {client.industry}
                  </div>
                )}
              </div>
              <button
                className="btn btn-gradient btn-sm"
                onClick={() => navigate('/planning', { state: { clientId: client.id } })}
                style={{ flexShrink: 0, borderRadius: 100 }}
              >
                + Planificar
              </button>
            </div>

            {client.website && (
              <a
                href={client.website}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', fontFamily: 'var(--font-mono)', marginTop: 8, display: 'inline-block' }}
              >
                {client.website} ↗
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Context block ── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <SectionLabel>Contexto del cliente</SectionLabel>
        {contextText ? (
          <div style={{
            fontSize: 'var(--text-base)',
            color: 'var(--color-text)',
            lineHeight: 1.75,
            whiteSpace: 'pre-wrap',
          }}>
            {contextText}
          </div>
        ) : (
          <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', fontStyle: 'italic' }}>
            Sin contexto escrito aún.{' '}
            <button
              className="btn btn-ghost btn-sm"
              style={{ padding: '2px 8px', fontSize: 12 }}
              onClick={() => navigate('/clients')}
            >
              Editar cliente →
            </button>
          </div>
        )}

        {/* Audio note */}
        {client.contextAudio && (
          <div style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid var(--color-border-light)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 18 }}>🎙</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6 }}>
                NOTA DE VOZ
              </div>
              <audio src={client.contextAudio} controls style={{ height: 32, width: '100%', maxWidth: 320 }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Team ── */}
      {hasTeam && (
        <div className="card" style={{ marginBottom: 16 }}>
          <SectionLabel>Equipo asignado</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <TeamMember role="Diseñador/a" name={client.teamDesign} />
            <TeamMember role="Copywriter" name={client.teamCopy} />
            <TeamMember role="Editor/a video" name={client.teamVideo} />
            <TeamMember role="Social Media" name={client.teamSocial} />
          </div>
        </div>
      )}

      {/* ── Trello ── */}
      {client.trelloBoardId && (
        <div className="card">
          <SectionLabel>Integración Trello</SectionLabel>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: 'linear-gradient(135deg, #0079bf, #00aecc)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 16, flexShrink: 0,
            }}>⬆</div>
            <div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 3 }}>Board ID</div>
              <code style={{
                fontSize: 'var(--text-sm)', color: 'var(--color-primary)',
                fontFamily: 'var(--font-mono)',
                background: 'var(--color-primary-light)',
                padding: '2px 10px', borderRadius: 6,
              }}>
                {client.trelloBoardId}
              </code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
