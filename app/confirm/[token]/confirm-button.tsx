'use client';

import { useState } from 'react';

interface ConfirmButtonProps {
  token: string;
}

export function ConfirmButton({ token }: ConfirmButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'confirmed' | 'error'>('idle');

  const handleConfirm = async () => {
    setStatus('loading');
    try {
      const res = await fetch(`/api/confirm/${token}`, { method: 'POST' });
      if (res.ok) {
        setStatus('confirmed');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  if (status === 'confirmed') {
    return (
      <div style={{
        textAlign: 'center',
        padding: '1rem',
        background: 'rgba(255, 140, 0, 0.08)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 140, 0, 0.15)',
      }}>
        <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>✅</span>
        <p style={{ color: '#ff8c00', fontSize: '1rem', fontWeight: 700, margin: 0 }}>
          ¡Asistencia confirmada!
        </p>
        <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0.5rem 0 0' }}>
          Te esperamos. 💻 Traé tu laptop si querés probar en vivo.
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Hubo un error. Intentá de nuevo.
        </p>
        <button
          onClick={handleConfirm}
          style={{
            width: '100%',
            padding: '1rem',
            fontSize: '1.05rem',
            fontWeight: 700,
            color: '#000',
            background: 'linear-gradient(135deg, #ff8c00 0%, #e67a00 100%)',
            border: 'none',
            borderRadius: '14px',
            cursor: 'pointer',
          }}
        >
          Reintentar ⚡
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConfirm}
      disabled={status === 'loading'}
      style={{
        width: '100%',
        padding: '1rem',
        fontSize: '1.05rem',
        fontWeight: 700,
        color: '#000',
        background: status === 'loading'
          ? 'linear-gradient(135deg, #8b6914 0%, #7a5c12 100%)'
          : 'linear-gradient(135deg, #ff8c00 0%, #e67a00 100%)',
        border: 'none',
        borderRadius: '14px',
        cursor: status === 'loading' ? 'wait' : 'pointer',
        boxShadow: '0 4px 24px rgba(255, 140, 0, 0.3)',
        transition: 'all 0.2s ease',
        letterSpacing: '-0.01em',
      }}
    >
      {status === 'loading' ? 'Confirmando...' : 'Confirmar asistencia ⚡'}
    </button>
  );
}
