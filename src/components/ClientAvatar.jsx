const GRADIENTS = [
  'linear-gradient(135deg, #6366f1, #8b5cf6)',
  'linear-gradient(135deg, #06b6d4, #3b82f6)',
  'linear-gradient(135deg, #10b981, #14b8a6)',
  'linear-gradient(135deg, #f59e0b, #f97316)',
  'linear-gradient(135deg, #8b5cf6, #ec4899)',
  'linear-gradient(135deg, #ef4444, #f59e0b)',
  'linear-gradient(135deg, #0ea5e9, #6366f1)',
  'linear-gradient(135deg, #ec4899, #a855f7)',
];

export function clientGradient(client) {
  const s = (client?.id || '') + (client?.name || '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

export default function ClientAvatar({ client, size = 40, radius }) {
  const r = radius ?? Math.round(size * 0.26);

  if (client?.photo) {
    return (
      <img
        src={client.photo}
        alt={client?.name || ''}
        style={{ width: size, height: size, borderRadius: r, objectFit: 'cover', flexShrink: 0, display: 'block' }}
      />
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: r,
      background: clientGradient(client),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff',
      fontSize: Math.round(size * 0.38),
      fontWeight: 800,
      flexShrink: 0,
      letterSpacing: '-0.01em',
      userSelect: 'none',
    }}>
      {client?.name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}
