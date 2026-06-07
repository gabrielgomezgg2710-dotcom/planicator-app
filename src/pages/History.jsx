import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import ClientAvatar from '../components/ClientAvatar';

export default function History() {
  const navigate = useNavigate();
  const { history, deletePlanningFromHistory, loadPlanningFromHistory, clients, addToast } = useStore();

  // Group by client, each group sorted newest first (history array is already newest-first)
  const grouped = history.reduce((acc, h) => {
    const key = h.clientName || h.clientId || 'Sin cliente';
    if (!acc[key]) acc[key] = [];
    acc[key].push(h);
    return acc;
  }, {});

  const handleLoad = (id) => {
    loadPlanningFromHistory(id);
    addToast({ type: 'success', message: 'Planificación cargada en Revisión' });
    navigate('/review');
  };

  const handleDelete = (id, name) => {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    deletePlanningFromHistory(id);
    addToast({ type: 'warning', message: 'Planificación eliminada del historial' });
  };

  const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Historial</h1>
          <p className="page-subtitle">
            {history.length} planificación{history.length !== 1 ? 'es' : ''} guardada{history.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/planning')} style={{ borderRadius: 100 }}>+ Nueva planificación</button>
      </div>

      {history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">◈</div>
          <div className="empty-state-title">Sin historial aún</div>
          <div className="empty-state-desc">
            Las planificaciones se guardan aquí automáticamente al subirlas a Trello, o manualmente desde Revisión
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/planning')}>Crear planificación</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          {Object.entries(grouped).map(([clientName, plannings]) => {
            const client = clients.find((c) => c.name === clientName);
            return (
              <div key={clientName}>
                {/* Client header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <ClientAvatar
                    client={client || { name: clientName, id: clientName }}
                    size={38}
                    radius={9}
                  />
                  <div>
                    <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>{clientName}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {plannings.length} planificación{plannings.length !== 1 ? 'es' : ''}
                    </div>
                  </div>
                </div>

                {/* Cards grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 14 }}>
                  {plannings.map((p) => (
                    <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {/* Header */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <div style={{ fontSize: 'var(--text-md)', fontWeight: 700 }}>{p.month}</div>
                            {p.publishedAt && (
                              <span className="badge badge-success" style={{ fontSize: 9, padding: '2px 7px' }}>
                                ⬆ Trello
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {p.posts?.length || 0} posts · {fmtDate(p.savedAt)}
                          </div>
                        </div>
                      </div>

                      {/* Topics */}
                      {p.topics?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 14 }}>
                          {(typeof p.topics === 'string'
                            ? p.topics.split('\n').filter(Boolean)
                            : p.topics
                          ).slice(0, 3).map((t, i) => (
                            <span key={i} className="badge badge-muted">{t}</span>
                          ))}
                        </div>
                      )}

                      <div className="divider" style={{ margin: '4px 0 12px' }} />

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn btn-gradient btn-sm"
                          style={{ flex: 1, borderRadius: 100 }}
                          onClick={() => handleLoad(p.id)}
                        >
                          Cargar
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(p.id, `${clientName} · ${p.month}`)}
                          title="Eliminar del historial"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
