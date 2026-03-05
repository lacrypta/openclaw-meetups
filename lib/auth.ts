import { getActiveSigner } from './signer';

declare global {
  interface Window {
    nostr?: {
      signEvent(event: any): Promise<any>;
      getPublicKey(): Promise<string>;
    };
  }
}

const TOKEN_KEY = 'openclaw_jwt';

export async function login(): Promise<{ token: string; pubkey: string }> {
  const signer = getActiveSigner();
  if (!signer) {
    throw new Error('No signer available. Please login first.');
  }

  const pubkey = await signer.getPublicKey();
  const nip98Url = window.location.origin + '/api/auth';

  // Create and sign NIP-98 event using the active signer
  const event = {
    kind: 27235,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['u', nip98Url],
      ['method', 'POST'],
    ],
    content: '',
  };

  const signedEvent = await signer.signEvent(event);

  const response = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signedEvent),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }

  const data = await response.json();
  localStorage.setItem(TOKEN_KEY, data.token);
  return data;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function getPubkeyFromToken(): string | null {
  const token = getToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.pubkey;
  } catch {
    return null;
  }
}
