import { useState, useCallback } from 'react';
import { loginWithNip07, nsecToHex, checkNip07 } from '../lib/nostr';

export type LoginMethod = 'nip07' | 'nsec' | 'bunker' | null;

interface NostrState {
  pubkey: string | null;
  method: LoginMethod;
  loading: boolean;
  error: string | null;
}

export function useNostr() {
  const [state, setState] = useState<NostrState>({
    pubkey: null,
    method: null,
    loading: false,
    error: null,
  });

  const loginNip07 = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const hasExtension = await checkNip07();
      if (!hasExtension) throw new Error('No se detectó extensión NIP-07 (Alby, nos2x, etc.)');
      const pubkey = await loginWithNip07();
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
      setState({ pubkey, method: 'bunker', loading: false, error: null });
    } catch (e: any) {
      setState((s) => ({ ...s, loading: false, error: e.message }));
    }
  }, []);

  const logout = useCallback(() => {
    setState({ pubkey: null, method: null, loading: false, error: null });
  }, []);

  return { ...state, loginNip07, loginNsec, loginBunker, logout };
}
