import { NavLink, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import ClientAvatar from './ClientAvatar';

const NAV = [
  { to: '/dashboard', icon: '⬡', label: 'Dashboard' },
  { to: '/clients', icon: '◎', label: 'Clientes' },
  { to: '/planning', icon: '✦', label: 'Planificación' },
  { to: '/review', icon: '▦', label: 'Revisión' },
  { to: '/history', icon: '◈', label: 'Historial' },
  { to: '/publish', icon: '⬆', label: 'Subir a Trello' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const activePlanning = useStore((s) => s.activePlanning);
  const clients = useStore((s) => s.clients);

  const activeClient = activePlanning
    ? clients.find((c) => c.id === activePlanning.clientId)
    : null;

  return (
    <aside style={{
      position: 'fixed',
      left: 0, top: 0, bottom: 0,
      width: 'var(--sidebar-width)',
      background: 'var(--sidebar-bg)',
      borderRight: '1px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--color-border-light)' }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 30, height: 30,
              background: 'var(--gradient-main)',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, color: '#fff', fontWeight: 800,
            }}>P</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--color-text)' }}>Planicator</div>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>v2.0 · Agency</div>
            </div>
          </div>
        </button>
      </div>

      {/* Active planning badge */}
      {activePlanning && (
        <div
          onClick={() => navigate('/review')}
          style={{
            margin: '10px 10px 0',
            padding: '10px 12px',
            background: 'var(--color-primary-light)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #c7d2fe',
            cursor: 'pointer',
            transition: 'background var(--transition)',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#e0e7ff'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-primary-light)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            {/* Client avatar (mini) */}
            {activeClient ? (
              <ClientAvatar client={activeClient} size={26} radius={6} />
            ) : (
              <div style={{
                width: 26, height: 26, borderRadius: 6,
                background: 'var(--gradient-main)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, color: '#fff', fontWeight: 800, flexShrink: 0,
              }}>
                {activePlanning.clientName?.[0]?.toUpperCase() || 'P'}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 1 }}>
                Activa
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activePlanning.clientName} · {activePlanning.month}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        {NAV.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-sm)',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              background: isActive ? 'var(--color-primary-light)' : 'transparent',
              marginBottom: 2,
              transition: 'all var(--transition)',
              textDecoration: 'none',
            })}
          >
            <span style={{ fontSize: 14, width: 20, textAlign: 'center', opacity: 0.85 }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Settings */}
      <div style={{ padding: '10px 8px', borderTop: '1px solid var(--color-border-light)' }}>
        <NavLink
          to="/settings"
          style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-sm)',
            fontWeight: isActive ? 600 : 500,
            color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            background: isActive ? 'var(--color-primary-light)' : 'transparent',
            transition: 'all var(--transition)', textDecoration: 'none',
          })}
        >
          <span style={{ fontSize: 14, width: 20, textAlign: 'center', opacity: 0.85 }}>⚙</span>
          Configuración
        </NavLink>
      </div>
    </aside>
  );
}
