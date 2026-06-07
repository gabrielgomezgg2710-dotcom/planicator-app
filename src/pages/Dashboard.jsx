import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';

function StatCard({ label, value, sub, color = 'var(--color-primary)' }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em', color }}>{value}</div>
      {sub && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{sub}</div>}
    </div>
  );
}

function PlanningRow({ planning, onLoad }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--color-border-light)',
      background: 'var(--color-bg)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: 'var(--color-success)',
          flexShrink: 0,
        }} />
        <div>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{planning.clientName}</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{planning.month} · {planning.posts?.length || 0} posts</div>
        </div>
      </div>
      <button className="btn btn-secondary btn-sm" onClick={() => onLoad(planning.id)}>Cargar</button>
    </div>
  );
}

function TeamWorkload({ clients }) {
  const team = ['Diseño', 'Copy', 'Video', 'Social'];
  const counts = team.map(() => Math.floor(Math.random() * clients.length * 3 + 1));
  const max = Math.max(...counts, 1);

  return (
    <div className="card">
      <div style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: 20 }}>Carga del equipo</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {team.map((name, i) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 60, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{name}</div>
            <div style={{ flex: 1, height: 6, background: 'var(--color-bg-alt)', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(counts[i] / max) * 100}%`,
                background: 'var(--gradient-main)',
                borderRadius: 100,
                transition: 'width 0.8s ease',
              }} />
            </div>
            <div style={{ width: 24, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>{counts[i]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { clients, history, activePlanning, loadPlanningFromHistory } = useStore();

  const handleLoadPlanning = (id) => {
    loadPlanningFromHistory(id);
    navigate('/review');
  };

  const recentHistory = history.slice(0, 5);

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Vista general de tu agencia</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/planning')}>
          + Nueva planificación
        </button>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        <StatCard label="Clientes activos" value={clients.length} sub="registrados" />
        <StatCard
          label="Planificaciones"
          value={history.length}
          sub="en historial"
          color="var(--color-secondary)"
        />
        <StatCard
          label="Posts generados"
          value={history.reduce((a, h) => a + (h.posts?.length || 0), 0)}
          sub="total histórico"
          color="var(--color-accent)"
        />
        <StatCard
          label="Estado actual"
          value={activePlanning ? 'Activa' : 'Sin plan'}
          sub={activePlanning ? `${activePlanning.clientName} · ${activePlanning.month}` : 'Crea una nueva'}
          color={activePlanning ? 'var(--color-success)' : 'var(--color-text-muted)'}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-6)', alignItems: 'start' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Active planning */}
          {activePlanning ? (
            <div className="card" style={{ borderLeft: '3px solid var(--color-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className="badge badge-primary">Activa</span>
                  </div>
                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>{activePlanning.clientName}</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{activePlanning.month} · {activePlanning.posts?.length || 0} posts generados</div>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/review')}>
                  Ver revisión →
                </button>
              </div>
              {activePlanning.topics?.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {activePlanning.topics.map((t, i) => (
                    <span key={i} className="badge badge-muted">{t}</span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
              <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>✦</div>
              <div style={{ fontSize: 'var(--text-md)', fontWeight: 600, marginBottom: 8 }}>Sin planificación activa</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 20 }}>
                Crea una nueva planificación mensual con IA
              </div>
              <button className="btn btn-primary" onClick={() => navigate('/planning')}>
                Crear planificación
              </button>
            </div>
          )}

          {/* Recent history */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 'var(--text-md)', fontWeight: 700 }}>Historial reciente</div>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/history')}>Ver todo</button>
            </div>
            {recentHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                No hay planificaciones guardadas aún
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recentHistory.map((h) => (
                  <PlanningRow key={h.id} planning={h} onLoad={handleLoadPlanning} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <TeamWorkload clients={clients} />

          {/* Quick actions */}
          <div className="card">
            <div style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: 16 }}>Acciones rápidas</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: '+ Nuevo cliente', to: '/clients', icon: '◎' },
                { label: 'Planificación mensual', to: '/planning', icon: '✦' },
                { label: 'Subir a Trello', to: '/publish', icon: '⬆' },
                { label: 'Configuración API', to: '/settings', icon: '⚙' },
              ].map(({ label, to, icon }) => (
                <button
                  key={to}
                  className="btn btn-ghost"
                  onClick={() => navigate(to)}
                  style={{
                    justifyContent: 'flex-start',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 500,
                    gap: 10,
                  }}
                >
                  <span style={{ color: 'var(--color-primary)' }}>{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Clients list */}
          {clients.length > 0 && (
            <div className="card">
              <div style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: 16 }}>Clientes</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {clients.slice(0, 5).map((c) => (
                  <div
                    key={c.id}
                    onClick={() => navigate(`/clients/${c.id}`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      transition: 'background var(--transition)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-alt)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: 'var(--gradient-main)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0,
                    }}>
                      {c.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{c.industry || 'Sin industria'}</div>
                    </div>
                  </div>
                ))}
                {clients.length > 5 && (
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate('/clients')}>
                    Ver {clients.length - 5} más...
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
