import { useEffect } from 'react';
import useStore from '../store/useStore';

function ToastItem({ toast }) {
  const removeToast = useStore((s) => s.removeToast);

  useEffect(() => {
    const t = setTimeout(() => removeToast(toast.id), toast.duration || 4000);
    return () => clearTimeout(t);
  }, [toast.id, toast.duration, removeToast]);

  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  const colors = {
    success: { bg: 'var(--color-success)', light: 'var(--color-success-light)' },
    error: { bg: 'var(--color-danger)', light: 'var(--color-danger-light)' },
    warning: { bg: 'var(--color-warning)', light: 'var(--color-warning-light)' },
    info: { bg: 'var(--color-primary)', light: 'var(--color-primary-light)' },
  };
  const c = colors[toast.type] || colors.info;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      background: '#fff',
      border: '1px solid var(--color-border)',
      borderLeft: `3px solid ${c.bg}`,
      borderRadius: 'var(--radius-lg)',
      padding: '12px 16px',
      boxShadow: 'var(--shadow-lg)',
      minWidth: '280px',
      maxWidth: '380px',
      animation: 'slideUp 0.2s ease',
    }}>
      <span style={{
        width: 24, height: 24,
        borderRadius: '50%',
        background: c.light,
        color: c.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700, flexShrink: 0,
      }}>
        {icons[toast.type] || icons.info}
      </span>
      <div style={{ flex: 1 }}>
        {toast.title && <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 2 }}>{toast.title}</div>}
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{toast.message}</div>
      </div>
      <button className="btn-icon" onClick={() => removeToast(toast.id)} style={{ fontSize: 16 }}>×</button>
    </div>
  );
}

export default function Toast() {
  const toasts = useStore((s) => s.toasts);
  return (
    <div className="toast-container">
      {toasts.map((t) => <ToastItem key={t.id} toast={t} />)}
    </div>
  );
}
