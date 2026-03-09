import { supabase } from '@/lib/supabase';
import { getGeneralSettings } from '@/lib/settings';
import { ConfirmButton } from './confirm-button';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function ConfirmPage({ params }: PageProps) {
  const { token } = await params;

  const { data: attendee, error } = await supabase
    .from('event_attendees')
    .select(`
      id,
      user_id,
      event_id,
      attendance_confirmed,
      users (name),
      events (id, name, date, location, description)
    `)
    .eq('confirmation_token', token)
    .maybeSingle();

  const eventData = attendee?.events as any;
  const userData = attendee?.users as any;

  // Invalid token
  if (error || !attendee || !eventData) {
    return (
      <main style={{
        background: '#060b18',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}>
        <div style={{
          maxWidth: '440px',
          width: '100%',
          textAlign: 'center',
        }}>
          <img
            src="https://raw.githubusercontent.com/lacrypta/branding/refs/heads/main/title/512-white-transparent.png"
            alt="La Crypta"
            style={{ width: '48px', height: '48px', margin: '0 auto 1.5rem', display: 'block', opacity: 0.5 }}
          />
          <div style={{
            background: 'linear-gradient(145deg, #0d1526 0%, #111b30 100%)',
            borderRadius: '20px',
            padding: '2.5rem 2rem',
            border: '1px solid rgba(255, 140, 0, 0.15)',
            boxShadow: '0 4px 40px rgba(0, 0, 0, 0.4)',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔗</div>
            <h1 style={{
              color: '#e2e8f0',
              fontSize: '1.35rem',
              fontWeight: 700,
              marginBottom: '0.75rem',
              letterSpacing: '-0.02em',
            }}>
              Link inválido
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>
              Este enlace de confirmación no es válido o ya fue utilizado.
              Contactate con el organizador del evento.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const alreadyConfirmed = attendee.attendance_confirmed;

  const settings = await getGeneralSettings();
  const tz = settings.timezone;
  const eventDate = new Date(eventData.date);
  const formattedDate = eventDate.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: tz,
  });
  const formattedTime = eventDate.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: tz,
  });
  const firstName = userData?.name?.split(' ')[0] || 'Asistente';

  return (
    <main style={{
      background: '#060b18',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        top: '-120px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255, 140, 0, 0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '460px', width: '100%', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          marginBottom: '2rem',
        }}>
          <img
            src="https://raw.githubusercontent.com/lacrypta/branding/refs/heads/main/title/512-white-transparent.png"
            alt="La Crypta"
            style={{ height: '28px', opacity: 0.85 }}
          />
          <span style={{
            color: '#334155',
            fontSize: '1.2rem',
            fontWeight: 300,
          }}>×</span>
          <span style={{
            color: '#64748b',
            fontSize: '0.8rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>OpenClaw</span>
        </div>

        {/* Main card */}
        <div style={{
          background: 'linear-gradient(145deg, #0d1526 0%, #0f1a2e 50%, #0d1526 100%)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 140, 0, 0.12)',
          boxShadow: '0 8px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.03) inset',
          overflow: 'hidden',
        }}>

          {/* Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 140, 0, 0.12) 0%, rgba(37, 99, 235, 0.08) 100%)',
            padding: '2rem 2rem 1.75rem',
            textAlign: 'center',
            borderBottom: '1px solid rgba(255, 140, 0, 0.08)',
          }}>
            {alreadyConfirmed ? (
              <>
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ff8c00 0%, #e67a00 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                  boxShadow: '0 4px 24px rgba(255, 140, 0, 0.3)',
                }}>
                  <span style={{ fontSize: '2rem', lineHeight: 1 }}>✓</span>
                </div>
                <h1 style={{
                  color: '#f8fafc',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  margin: '0 0 0.4rem',
                  letterSpacing: '-0.02em',
                }}>
                  ¡Estás adentro, {firstName}!
                </h1>
                <p style={{
                  color: '#94a3b8',
                  fontSize: '0.9rem',
                  margin: 0,
                  lineHeight: 1.5,
                }}>
                  Tu asistencia a <strong style={{ color: '#cbd5e1' }}>{eventData.name}</strong> ya está confirmada.
                </p>
              </>
            ) : (
              <>
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1e3a5f 0%, #1a2e4a 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                  boxShadow: '0 4px 24px rgba(37, 99, 235, 0.2)',
                }}>
                  <span style={{ fontSize: '2rem', lineHeight: 1 }}>👋</span>
                </div>
                <h1 style={{
                  color: '#f8fafc',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  margin: '0 0 0.4rem',
                  letterSpacing: '-0.02em',
                }}>
                  ¡Hola {firstName}!
                </h1>
                <p style={{
                  color: '#94a3b8',
                  fontSize: '0.9rem',
                  margin: 0,
                  lineHeight: 1.5,
                }}>
                  Confirmá tu asistencia a <strong style={{ color: '#cbd5e1' }}>{eventData.name}</strong>
                </p>
              </>
            )}
          </div>

          {/* Event details */}
          <div style={{ padding: '1.75rem 2rem' }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.875rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(255, 140, 0, 0.08)',
                  border: '1px solid rgba(255, 140, 0, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: '1rem' }}>📅</span>
                </div>
                <div>
                  <p style={{
                    color: '#e2e8f0',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    margin: 0,
                    textTransform: 'capitalize',
                  }}>
                    {formattedDate}
                  </p>
                  <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0.15rem 0 0' }}>
                    {formattedTime} hs · Hora Argentina
                  </p>
                </div>
              </div>

              {eventData.location && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(37, 99, 235, 0.08)',
                    border: '1px solid rgba(37, 99, 235, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <span style={{ fontSize: '1rem' }}>📍</span>
                  </div>
                  <div>
                    <p style={{
                      color: '#e2e8f0',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      margin: 0,
                    }}>
                      {eventData.location}
                    </p>
                    <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0.15rem 0 0' }}>
                      Buenos Aires, Argentina
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm button (only if not yet confirmed) */}
            {!alreadyConfirmed && (
              <>
                <div style={{
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 140, 0, 0.15), transparent)',
                  margin: '1.5rem 0',
                }} />
                <ConfirmButton token={token} />
              </>
            )}

            {alreadyConfirmed && (
              <>
                <div style={{
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 140, 0, 0.15), transparent)',
                  margin: '1.5rem 0',
                }} />
                <div style={{
                  background: 'rgba(255, 140, 0, 0.04)',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                  border: '1px solid rgba(255, 140, 0, 0.06)',
                }}>
                  <p style={{
                    color: '#94a3b8',
                    fontSize: '0.85rem',
                    lineHeight: 1.7,
                    margin: 0,
                  }}>
                    💻 Traé tu laptop si querés probar en vivo
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <p style={{
            color: '#334155',
            fontSize: '0.75rem',
            margin: 0,
            letterSpacing: '0.04em',
          }}>
            Vas a recibir más detalles por email de Luma
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginTop: '0.25rem',
          }}>
            <img
              src="https://raw.githubusercontent.com/lacrypta/branding/refs/heads/main/title/512-white-transparent.png"
              alt="La Crypta"
              style={{ width: '16px', height: '16px', opacity: 0.3 }}
            />
            <span style={{ color: '#1e293b', fontSize: '0.7rem' }}>
              La Crypta · Bitcoin o Muerte 💀
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
