/**
 * Unified Nostr Signer — abstracts NIP-07 (extension), NIP-46 (bunker), and nsec (plain key).
 * Provides a single interface for signing events regardless of login method.
 */

import { EventTemplate, VerifiedEvent } from 'nostr-tools/pure';

export interface NostrSigner {
  getPublicKey(): Promise<string>;
  signEvent(event: EventTemplate): Promise<VerifiedEvent>;
  close?(): Promise<void>;
}

const SIGNER_KEY = 'openclaw_signer';

// In-memory signer instance (lost on page reload for bunker, restored from storage)
let activeSigner: NostrSigner | null = null;

export function getActiveSigner(): NostrSigner | null {
  return activeSigner;
}

export function setActiveSigner(signer: NostrSigner | null): void {
  activeSigner = signer;
}

export function clearActiveSigner(): void {
  if (activeSigner?.close) {
    activeSigner.close().catch(() => {});
  }
  activeSigner = null;
}

// -- NIP-07 Signer (browser extension) --

export class Nip07Signer implements NostrSigner {
  async getPublicKey(): Promise<string> {
    if (!window.nostr) throw new Error('NIP-07 extension not available');
    return window.nostr.getPublicKey();
  }

  async signEvent(event: EventTemplate): Promise<VerifiedEvent> {
    if (!window.nostr) throw new Error('NIP-07 extension not available');
    return window.nostr.signEvent(event);
  }
}

// -- Plain Key Signer (nsec) --

export class PlainSigner implements NostrSigner {
  private seckey: Uint8Array;
  private pubkey: string;

  constructor(seckey: Uint8Array, pubkey: string) {
    this.seckey = seckey;
    this.pubkey = pubkey;
  }

  async getPublicKey(): Promise<string> {
    return this.pubkey;
  }

  async signEvent(event: EventTemplate): Promise<VerifiedEvent> {
    const { finalizeEvent } = await import('nostr-tools/pure');
    return finalizeEvent(event, this.seckey);
  }
}

// -- Bunker Signer Storage (persist client secret for reconnection) --

interface BunkerState {
  clientSecretHex: string;
  remotePubkey: string;
  relays: string[];
  secret: string | null;
}

export function saveBunkerState(state: BunkerState): void {
  localStorage.setItem(SIGNER_KEY, JSON.stringify(state));
}

export function loadBunkerState(): BunkerState | null {
  try {
    const raw = localStorage.getItem(SIGNER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearBunkerState(): void {
  localStorage.removeItem(SIGNER_KEY);
}
