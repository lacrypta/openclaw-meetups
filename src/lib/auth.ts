declare global {
  interface Window {
    nostr?: {
      signEvent(event: any): Promise<any>;
      getPublicKey(): Promise<string>;
    };
  }
}

const TOKEN_KEY = 'openclaw_jwt';
const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3000';

export async function createNip98Event(url: string, method: string): Promise<any> {
  if (!window.nostr) {
    throw new Error('NIP-07 extension not found');
  }

  const pubkey = await window.nostr.getPublicKey();
  const event = {
    kind: 27235,
    pubkey,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['u', url],
      ['method', method],
    ],
    content: '',
  };

  return await window.nostr.signEvent(event);
}

export async function login(): Promise<{ token: string; pubkey: string }> {
  const url = `${API_BASE}/api/auth`;
  const signedEvent = await createNip98Event(url, 'POST');

  const response = await fetch(url, {
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
    // Decode JWT payload (without verification, just to check expiry)
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
