import { supabase } from '@/lib/supabase';
import { confirmAttendance } from '@/lib/confirm-attendance';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function ConfirmPage({ params }: PageProps) {
  const { token } = await params;

  // Fetch attendee + event by token
  const { data: attendee, error } = await supabase
    .from('event_attendees')
    .select(`
      id,
      user_id,
      event_id,
      attendance_confirmed,
      users (name),
      events (id, name, date, location)
    `)
    .eq('confirmation_token', token)
    .maybeSingle();

  const eventData = attendee?.events as any;
  const userData = attendee?.users as any;

  if (error || !attendee || !eventData) {
    return (
      <main style={{ background: '#060b18', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ background: '#0d1526', borderRadius: '16px', padding: '2.5rem', maxWidth: '480px', width: '100%', textAlign: 'center', border: '1px solid #1e2d4d' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
          <h1 style={{ color: '#f59e0b', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            Link inválido o expirado
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Este enlace de confirmación no es válido. Contactate con el organizador del evento.
          </p>
        </div>
      </main>
    );
  }

  // Auto-confirm on page load
  if (!attendee.attendance_confirmed) {
    try {
      await confirmAttendance(attendee.id);
    } catch (e) {
      console.error('Auto-confirm error:', e);
    }
  }

  const eventDate = new Date(eventData.date);
  const formattedDate = eventDate.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const formattedTime = eventDate.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const firstName = userData?.name?.split(' ')[0] || 'Asistente';

  return (
    <main style={{ background: '#060b18', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#0d1526', borderRadius: '16px', padding: '2.5rem', maxWidth: '480px', width: '100%', textAlign: 'center', border: '1px solid #1e2d4d' }}>
        
        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎉</div>
        
        <h1 style={{ color: '#f59e0b', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          ¡Confirmado, {firstName}!
        </h1>
        
        <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          Tu lugar en <strong style={{ color: '#f1f5f9' }}>{eventData.name}</strong> está reservado.
        </p>

        <div style={{ background: '#0a1020', borderRadius: '12px', padding: '1.25rem', border: '1px solid #1e2d4d', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#cbd5e1', fontSize: '0.95rem', marginBottom: '0.6rem' }}>
            <span>📅</span>
            <span style={{ textTransform: 'capitalize' }}>{formattedDate}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#cbd5e1', fontSize: '0.95rem', marginBottom: eventData.location ? '0.6rem' : '0' }}>
            <span>🕐</span>
            <span>{formattedTime} hs</span>
          </div>
          {eventData.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#cbd5e1', fontSize: '0.95rem' }}>
              <span>📍</span>
              <span>{eventData.location}</span>
            </div>
          )}
        </div>

        <p style={{ color: '#475569', fontSize: '0.8rem', marginTop: '1.5rem' }}>
          Te esperamos ⚡
        </p>
      </div>
    </main>
  );
}
