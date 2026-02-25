"use client";

import { useState, useCallback, useEffect } from 'react';
import { loginWithNip07, nsecToHex, checkNip07 } from '../lib/nostr';

export type LoginMethod = 'nip07' | 'nsec' | 'bunker' | null;

const NOSTR_STATE_KEY = 'openclaw_nostr';

interface NostrState {
  pubkey: string | null;
  method: LoginMethod;
  loading: boolean;
  error: string | null;
}

function loadSavedState(): { pubkey: string | null; method: LoginMethod } {
  if (typeof window === 'undefined') return { pubkey: null, method: null };
  try {
    const saved = localStorage.getItem(NOSTR_STATE_KEY);
    if (saved) {
      const { pubkey, method } = JSON.parse(saved);
      if (pubkey && method) return { pubkey, method };
    }
  } catch {}
  return { pubkey: null, method: null };
}

function saveState(pubkey: string | null, method: LoginMethod) {
  if (pubkey && method) {
    localStorage.setItem(NOSTR_STATE_KEY, JSON.stringify({ pubkey, method }));
  } else {
    localStorage.removeItem(NOSTR_STATE_KEY);
  }
}

export function useNostr() {
  const [state, setState] = useState<NostrState>({
    pubkey: null,
    method: null,
    loading: false,
    error: null,
  });

  // On mount, restore saved state and verify NIP-07 session
  useEffect(() => {
    const saved = loadSavedState();
    if (saved.pubkey && saved.method) {
      setState(s => ({ ...s, pubkey: saved.pubkey, method: saved.method }));

      if (saved.method === 'nip07') {
        checkNip07().then(async (hasExt) => {
          if (hasExt) {
            try {
              const currentPubkey = await loginWithNip07();
              if (currentPubkey !== saved.pubkey) {
                saveState(currentPubkey, 'nip07');
                setState(s => ({ ...s, pubkey: currentPubkey }));
              }
            } catch {
              saveState(null, null);
              setState(s => ({ ...s, pubkey: null, method: null }));
            }
          }
        });
      }
    }
  }, []);

  const loginNip07 = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const hasExtension = await checkNip07();
      if (!hasExtension) throw new Error('No se detectó extensión NIP-07 (Alby, nos2x, etc.)');
      const pubkey = await loginWithNip07();
      saveState(pubkey, 'nip07');
      setState({ pubkey, method: 'nip07', loading: false, error: null });
    } catch (e: any) {
      setState((s) => ({ ...s, loading: false, error: e.message }));
    }
  }, []);

  const loginNsec = useCallback(async (nsec: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      if (!nsec.startsWith('nsec1')) throw new Error('nsec inválido');
      const { pubkey } = nsecToHex(nsec);
      saveState(pubkey, 'nsec');
      setState({ pubkey, method: 'nsec', loading: false, error: null });
    } catch (e: any) {
      setState((s) => ({ ...s, loading: false, error: e.message }));
    }
  }, []);

  const loginBunker = useCallback(async (bunkerUrl: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      if (!bunkerUrl.startsWith('bunker://')) throw new Error('URL inválida. Debe empezar con bunker://');
      // NIP-46 basic: extract pubkey from bunker URL
      const url = new URL(bunkerUrl.replace('bunker://', 'https://'));
      const pubkey = url.hostname || url.pathname.replace('//', '');
      if (!pubkey || pubkey.length !== 64) throw new Error('No se pudo extraer pubkey del bunker URL');
      // In production, you'd establish a NIP-46 connection here
      saveState(pubkey, 'bunker');
      setState({ pubkey, method: 'bunker', loading: false, error: null });
    } catch (e: any) {
      setState((s) => ({ ...s, loading: false, error: e.message }));
    }
  }, []);

  const logout = useCallback(() => {
    saveState(null, null);
    setState({ pubkey: null, method: null, loading: false, error: null });
  }, []);

  return { ...state, loginNip07, loginNsec, loginBunker, logout };
}
