import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey);
}

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function ConfirmPage({ params }: PageProps) {
  const { token } = await params;

  const supabaseAdmin = getSupabaseAdmin();

  // Fetch attendee + event by token
  const { data: attendee, error } = await supabaseAdmin
    .from('event_attendees')
    .select(`
      id,
      user_id,
      attendance_confirmed,
      confirmed_at,
      status,
      users (name, email),
      events (id, name, date, location, description, image_url)
    `)
    .eq('confirmation_token', token)
    .maybeSingle();

  const eventData = attendee?.events as any;
  const userData = attendee?.users as any;

  // Error or not found
  if (error || !attendee || !eventData) {
    return (
      <main style={{ background: '#060b18', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ background: '#0d1526', borderRadius: '16px', padding: '2.5rem', maxWidth: '480px', width: '100%', textAlign: 'center', border: '1px solid #1e2d4d' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
          <h1 style={{ color: '#f59e0b', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            Link inválido o expirado
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Este enlace de confirmación no es válido o ya expiró. Por favor contactate con el organizador del evento.
          </p>
        </div>
      </main>
    );
  }

  const isConfirmed = attendee.attendance_confirmed;
  const eventDate = new Date(eventData.date);
  const formattedDate = eventDate.toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <main style={{ background: '#060b18', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ maxWidth: '520px', width: '100%' }}>
        {/* Event image */}
        {eventData.image_url && (
          <div style={{ borderRadius: '16px 16px 0 0', overflow: 'hidden', height: '200px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={eventData.image_url}
              alt={eventData.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}

        <div style={{
          background: '#0d1526',
          borderRadius: eventData.image_url ? '0 0 16px 16px' : '16px',
          padding: '2rem',
          border: '1px solid #1e2d4d',
          borderTop: eventData.image_url ? 'none' : '1px solid #1e2d4d',
        }}>
          {/* Brand header */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <span style={{ color: '#f59e0b', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              OpenClaw Meetups
            </span>
          </div>

          {/* Event name */}
          <h1 style={{ color: '#f1f5f9', fontSize: '1.6rem', fontWeight: 700, margin: '0 0 1rem', lineHeight: 1.3 }}>
            {eventData.name}
          </h1>

          {/* Event details */}
          <div style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>
              <span>📅</span>
              <span style={{ textTransform: 'capitalize' }}>{formattedDate}</span>
            </div>
            {eventData.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                <span>📍</span>
                <span>{eventData.location}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {eventData.description && (
            <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              {eventData.description}
            </p>
          )}

          {/* Divider */}
          <hr style={{ border: 'none', borderTop: '1px solid #1e2d4d', margin: '1.5rem 0' }} />

          {/* Attendee greeting */}
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            Hola, <strong style={{ color: '#f1f5f9' }}>{userData?.name || 'asistente'}</strong>
          </p>

          {/* Confirmation status */}
          {isConfirmed ? (
            <div style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '12px',
              padding: '1.25rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
              <p style={{ color: '#4ade80', fontWeight: 600, fontSize: '1rem', margin: 0 }}>
                Ya confirmaste tu asistencia
              </p>
              {attendee.confirmed_at && (
                <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.4rem' }}>
                  Confirmado el {new Date(attendee.confirmed_at).toLocaleDateString('es-AR')}
                </p>
              )}
            </div>
          ) : (
            <form action={`/api/confirm/${token}`} method="POST">
              <button
                type="submit"
                style={{
                  width: '100%',
                  background: '#f59e0b',
                  color: '#060b18',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '1rem',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: '0.02em',
                }}
              >
                ✅ Confirmar Asistencia
              </button>
              <p style={{ color: '#475569', fontSize: '0.75rem', textAlign: 'center', marginTop: '0.75rem' }}>
                Al confirmar, tu lugar queda reservado en el evento.
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
