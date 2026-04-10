"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { checkNip07, getPublicKey, RELAYS } from '../lib/nostr';
import {
  NostrSigner,
  Nip07Signer,
  PlainSigner,
  getActiveSigner,
  setActiveSigner,
  clearActiveSigner,
  saveBunkerState,
  loadBunkerState,
  clearBunkerState,
} from '../lib/signer';

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
  const bunkerSignerRef = useRef<any>(null);

  // On mount, restore saved state and reconnect signer
  useEffect(() => {
    const saved = loadSavedState();
    if (!saved.pubkey || !saved.method) return;

    setState(s => ({ ...s, pubkey: saved.pubkey, method: saved.method }));

    if (saved.method === 'nip07') {
      const signer = new Nip07Signer();
      setActiveSigner(signer);
      // Verify extension is still available
      checkNip07().then(async (hasExt) => {
        if (hasExt) {
          try {
            const currentPubkey = await signer.getPublicKey();
            if (currentPubkey !== saved.pubkey) {
              saveState(currentPubkey, 'nip07');
              setState(s => ({ ...s, pubkey: currentPubkey }));
            }
          } catch {
            clearActiveSigner();
            saveState(null, null);
            setState(s => ({ ...s, pubkey: null, method: null }));
          }
        }
      });
    } else if (saved.method === 'bunker') {
      // Try to reconnect bunker from saved state
      reconnectBunker().catch(() => {
        // If reconnection fails, clear state
        clearActiveSigner();
        clearBunkerState();
        saveState(null, null);
        setState(s => ({ ...s, pubkey: null, method: null }));
      });
    }
    // nsec: signer can't be restored (secret not persisted for security)
    // User needs to re-login with nsec
  }, []);

  function hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }

  function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function reconnectBunker() {
    const bunkerState = loadBunkerState();
    if (!bunkerState) throw new Error('No bunker state saved');

    const { BunkerSigner } = await import('nostr-tools/nip46');

    const clientSecret = hexToBytes(bunkerState.clientSecretHex);
    const bp = {
      pubkey: bunkerState.remotePubkey,
      relays: bunkerState.relays,
      secret: bunkerState.secret,
    };

    const signer = BunkerSigner.fromBunker(clientSecret, bp);
    await signer.connect();
    const pubkey = await signer.getPublicKey();

    bunkerSignerRef.current = signer;
    setActiveSigner(signer);
    setState(s => ({ ...s, pubkey, method: 'bunker' }));
    saveState(pubkey, 'bunker');
  }

  const loginNip07 = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const hasExtension = await checkNip07();
      if (!hasExtension) throw new Error('No se detectó extensión NIP-07 (Alby, nos2x, etc.)');

      const signer = new Nip07Signer();
      const pubkey = await signer.getPublicKey();

      setActiveSigner(signer);
      saveState(pubkey, 'nip07');
      setState({ pubkey, method: 'nip07', loading: false, error: null });
    } catch (e: any) {
      setState((s) => ({ ...s, loading: false, error: e.message }));
      throw e;
    }
  }, []);

  const loginNsec = useCallback(async (nsec: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      if (!nsec.startsWith('nsec1')) throw new Error('nsec inválido');
      const { nsecToHex } = await import('../lib/nostr');
      const { seckey, pubkey } = nsecToHex(nsec);

      const signer = new PlainSigner(seckey, pubkey);
      setActiveSigner(signer);
      saveState(pubkey, 'nsec');
      setState({ pubkey, method: 'nsec', loading: false, error: null });
    } catch (e: any) {
      setState((s) => ({ ...s, loading: false, error: e.message }));
      throw e;
    }
  }, []);

  const loginBunker = useCallback(async (bunkerUrl: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { BunkerSigner, parseBunkerInput } = await import('nostr-tools/nip46');
      const { generateSecretKey } = await import('nostr-tools/pure');

      // Parse bunker URL
      const bp = await parseBunkerInput(bunkerUrl);
      if (!bp) throw new Error('URL de bunker inválida');

      // Generate ephemeral client keypair
      const clientSecret = generateSecretKey();
      const clientSecretHex = bytesToHex(clientSecret);

      // Create bunker signer and connect
      const signer = BunkerSigner.fromBunker(clientSecret, bp);
      await signer.connect();
      const pubkey = await signer.getPublicKey();

      // Save bunker state for reconnection
      saveBunkerState({
        clientSecretHex,
        remotePubkey: bp.pubkey,
        relays: bp.relays,
        secret: bp.secret,
      });

      bunkerSignerRef.current = signer;
      setActiveSigner(signer);
      saveState(pubkey, 'bunker');
      setState({ pubkey, method: 'bunker', loading: false, error: null });
    } catch (e: any) {
      clearActiveSigner();
      clearBunkerState();
      setState((s) => ({ ...s, loading: false, error: e.message }));
      throw e; // Re-throw so callers know login failed
    }
  }, []);

  const nostrConnectAbortRef = useRef<AbortController | null>(null);

  const loginNostrConnect = useCallback(async (): Promise<{ uri: string; promise: Promise<void>; abort: () => void }> => {
    const { generateSecretKey: genKey, getPublicKey: getPub } = await import('nostr-tools/pure');
    const { createNostrConnectURI, BunkerSigner } = await import('nostr-tools/nip46');
    const nip04 = await import('nostr-tools/nip04');
    const { SimplePool } = await import('nostr-tools/pool');

    const clientSecret = genKey();
    const clientPubkey = getPub(clientSecret);
    const secret = bytesToHex(genKey()).slice(0, 32);
    const relays = RELAYS.slice(0, 2);

    const uri = createNostrConnectURI({
      clientPubkey,
      relays,
      secret,
      name: 'OpenClaw',
      url: typeof window !== 'undefined' ? window.location.origin : '',
    });

    const abortController = new AbortController();
    nostrConnectAbortRef.current = abortController;

    const promise = (async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {

        // Custom subscription that handles both NIP-44 and NIP-04 encryption
        // (BunkerSigner.fromURI only supports NIP-44, but many bunker apps use NIP-04)
        const pool = new SimplePool();
        const remotePubkey = await new Promise<string>((resolve, reject) => {
          const sub = pool.subscribe(
            relays,
            {
              kinds: [24133],
              '#p': [clientPubkey],
              limit: 0,
            },
            {
              onevent: async (event) => {
                try {
                  let decrypted: string;
                  try {
                    // Try NIP-04 first (most bunker apps use this)
                    decrypted = await nip04.decrypt(bytesToHex(clientSecret), event.pubkey, event.content);
                  } catch {
                    // Fall back to NIP-44 (nostr-tools native)
                    const { decrypt: nip44decrypt } = await import('nostr-tools/nip44');
                    const { getConversationKey } = await import('nostr-tools/nip44');
                    const convKey = getConversationKey(clientSecret, event.pubkey);
                    decrypted = nip44decrypt(event.content, convKey);
                  }

                  const response = JSON.parse(decrypted);

                  if (response.result === secret) {
                    sub.close();
                    resolve(event.pubkey);
                  }
                } catch (e) {
                }
              },
              onclose: () => {
                reject(new Error('subscription closed'));
              },
              abort: abortController.signal,
            },
          );
        });


        // Now create a proper BunkerSigner for ongoing communication
        const bp = { pubkey: remotePubkey, relays, secret };
        const signer = BunkerSigner.fromBunker(clientSecret, bp);
        const pubkey = await signer.getPublicKey();

        const clientSecretHex = bytesToHex(clientSecret);
        saveBunkerState({
          clientSecretHex,
          remotePubkey,
          relays,
          secret,
        });

        bunkerSignerRef.current = signer;
        setActiveSigner(signer);
        saveState(pubkey, 'bunker');
        setState({ pubkey, method: 'bunker', loading: false, error: null });
      } catch (e: any) {
        if (e.name === 'AbortError') {
          setState((s) => ({ ...s, loading: false, error: null }));
          return;
        }
        clearActiveSigner();
        clearBunkerState();
        setState((s) => ({ ...s, loading: false, error: e.message }));
        throw e;
      } finally {
        nostrConnectAbortRef.current = null;
      }
    })();

    return { uri, promise, abort: () => abortController.abort() };
  }, []);

  const logout = useCallback(() => {
    nostrConnectAbortRef.current?.abort();
    clearActiveSigner();
    clearBunkerState();
    saveState(null, null);
    if (bunkerSignerRef.current) {
      bunkerSignerRef.current.close?.().catch(() => {});
      bunkerSignerRef.current = null;
    }
    setState({ pubkey: null, method: null, loading: false, error: null });
  }, []);

  return { ...state, loginNip07, loginNsec, loginBunker, loginNostrConnect, logout };
}
