import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ROTATING_WORDS = ['contenido', 'estrategia', 'creatividad', 'resultados', 'campañas'];

const FEATURES = [
  { icon: '✦', title: 'Generación con IA', desc: 'Claude AI crea copies, guiones y briefs completos para todo el mes.' },
  { icon: '◎', title: 'Gestión de clientes', desc: 'Brief permanente por cliente: tono, público, diferenciadores y equipo.' },
  { icon: '▦', title: 'Calendario visual', desc: 'Vista semanal con edición inline de cada tarjeta de contenido.' },
  { icon: '⬆', title: 'Subida a Trello', desc: 'Crea todas las tarjetas automáticamente con asignaciones de equipo.' },
  { icon: '◈', title: 'Historial por cliente', desc: 'Accede y reutiliza cualquier planificación anterior con un clic.' },
  { icon: '⬡', title: 'Dashboard de agencia', desc: 'Stats, carga del equipo y rendimiento de todas las cuentas.' },
];

export default function Landing() {
  const navigate = useNavigate();
  const [wordIdx, setWordIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setWordIdx((i) => (i + 1) % ROTATING_WORDS.length);
        setFade(true);
      }, 300);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', color: '#0d0d0d', fontFamily: 'var(--font-sans)' }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        padding: '0 48px',
        height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(250,250,250,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30,
            background: 'var(--gradient-main)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 800, color: '#fff',
          }}>P</div>
          <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', color: '#0d0d0d' }}>Planicator</span>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
          Entrar al Dashboard →
        </button>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        paddingTop: 64,
      }}>
        {/* Video de fondo: muy desaturado y opaco para que no compita con el texto */}
        <video
          autoPlay muted loop playsInline
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            opacity: 0.12,
            filter: 'grayscale(100%) brightness(1.4)',
          }}
        >
          <source src="/Video_hero.mp4" type="video/mp4" />
        </video>

        {/* Overlay muy sutil para suavizar bordes del video */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(250,250,250,0.55) 0%, rgba(250,250,250,0.1) 50%, rgba(250,250,250,0.8) 100%)',
          pointerEvents: 'none',
        }} />

        {/* Contenido */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 24px', maxWidth: 840 }}>

          {/* Pill badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--color-primary-light)',
            border: '1px solid #c7d2fe',
            borderRadius: 100,
            padding: '6px 16px',
            fontSize: 11, fontWeight: 700,
            color: 'var(--color-primary)',
            marginBottom: 36,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
          }}>
            ✦ Social Media Planning · Agency Tool
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(44px, 7vw, 82px)',
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-0.035em',
            color: '#0d0d0d',
            marginBottom: 20,
          }}>
            Más{' '}
            <span style={{
              display: 'inline-block',
              background: 'var(--gradient-main)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              opacity: fade ? 1 : 0,
              transform: fade ? 'translateY(0)' : 'translateY(-10px)',
              transition: 'opacity 0.28s ease, transform 0.28s ease',
              minWidth: '230px',
            }}>
              {ROTATING_WORDS[wordIdx]}
            </span>
            ,<br />menos trabajo manual
          </h1>

          {/* Subheadline */}
          <p style={{
            fontSize: 18,
            color: '#52525b',
            maxWidth: 520,
            margin: '0 auto 48px',
            lineHeight: 1.75,
            fontWeight: 400,
          }}>
            Genera planificaciones completas de social media con Claude AI. Copies, guiones, briefs para diseñadores — todo en segundos.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/dashboard')}>
              Empezar ahora →
            </button>
            <button
              className="btn btn-lg"
              onClick={() => navigate('/planning')}
              style={{
                background: '#fff',
                color: '#0d0d0d',
                border: '1.5px solid var(--color-border)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              Ver planificación
            </button>
          </div>

          {/* Stats */}
          <div style={{
            display: 'flex', gap: 56, justifyContent: 'center',
            marginTop: 72, paddingTop: 48,
            borderTop: '1px solid var(--color-border)',
          }}>
            {[
              { n: '10x', label: 'más rápido' },
              { n: '∞', label: 'clientes' },
              { n: 'AI', label: 'generación' },
            ].map(({ n, label }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 34, fontWeight: 800, letterSpacing: '-0.03em',
                  background: 'var(--gradient-main)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>{n}</div>
                <div style={{ fontSize: 12, color: '#a1a1aa', fontFamily: 'var(--font-mono)', marginTop: 5 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: '100px 48px', background: '#fff', borderTop: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{
              fontSize: 'clamp(26px, 4vw, 42px)',
              fontWeight: 800, letterSpacing: '-0.03em',
              color: '#0d0d0d', marginBottom: 14,
            }}>
              Todo lo que necesita tu agencia
            </h2>
            <p style={{ color: '#71717a', fontSize: 16, maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
              Desde el brief del cliente hasta las tarjetas en Trello, sin salir de la plataforma.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
            {FEATURES.map(({ icon, title, desc }) => (
              <div
                key={title}
                style={{
                  background: '#fafafa',
                  border: '1px solid var(--color-border)',
                  borderRadius: 14,
                  padding: '28px 24px',
                  transition: 'all 0.18s ease',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-primary-light)';
                  e.currentTarget.style.borderColor = '#c7d2fe';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#fafafa';
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 14, color: 'var(--color-primary)' }}>{icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: '#0d0d0d' }}>{title}</div>
                <div style={{ fontSize: 14, color: '#71717a', lineHeight: 1.65 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section style={{
        padding: '80px 48px',
        textAlign: 'center',
        background: '#fafafa',
        borderTop: '1px solid var(--color-border)',
      }}>
        <div style={{
          display: 'inline-block',
          background: 'var(--gradient-soft)',
          border: '1px solid #c7d2fe',
          borderRadius: 24,
          padding: '56px 72px',
          maxWidth: 560,
        }}>
          <h2 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.025em', color: '#0d0d0d', marginBottom: 12 }}>
            ¿Listo para escalar?
          </h2>
          <p style={{ color: '#71717a', fontSize: 15, marginBottom: 28, lineHeight: 1.7 }}>
            Tu equipo va a agradecer las horas que les ahorras.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/dashboard')}>
            Abrir Planicator →
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        padding: '20px 48px',
        borderTop: '1px solid var(--color-border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#fff',
      }}>
        <span style={{ fontSize: 12, color: '#a1a1aa', fontFamily: 'var(--font-mono)' }}>Planicator v2.0</span>
        <span style={{ fontSize: 12, color: '#a1a1aa' }}>Agency Social Media Planning Tool</span>
      </footer>
    </div>
  );
}
