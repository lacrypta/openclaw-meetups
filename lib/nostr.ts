import { generateSecretKey, getPublicKey, finalizeEvent } from 'nostr-tools/pure';
import * as nip19 from 'nostr-tools/nip19';
import { Relay } from 'nostr-tools/relay';

export const RELAYS = [
  'wss://relay.damus.io',
  'wss://relay.nostr.band',
  'wss://nos.lol',
  'wss://relay.lacrypta.ar',
];

export interface NostrProfile {
  name?: string;
  display_name?: string;
  picture?: string;
  about?: string;
  nip05?: string;
  lud16?: string;
  banner?: string;
}

export function nsecToHex(nsec: string): { seckey: Uint8Array; pubkey: string } {
  const decoded = nip19.decode(nsec);
  if (decoded.type !== 'nsec') throw new Error('Invalid nsec');
  const seckey = decoded.data as Uint8Array;
  const pubkey = getPublicKey(seckey);
  return { seckey, pubkey };
}

export function npubEncode(hex: string): string {
  return nip19.npubEncode(hex);
}

export async function fetchProfile(pubkey: string): Promise<NostrProfile | null> {
  for (const url of RELAYS) {
    try {
      const relay = await Relay.connect(url);
      const profile = await new Promise<NostrProfile | null>((resolve) => {
        const timeout = setTimeout(() => {
          sub.close();
          resolve(null);
        }, 5000);

        const sub = relay.subscribe(
          [{ kinds: [0], authors: [pubkey], limit: 1 }],
          {
            onevent(event) {
              clearTimeout(timeout);
              try {
                resolve(JSON.parse(event.content));
              } catch {
                resolve(null);
              }
              sub.close();
            },
            oneose() {
              clearTimeout(timeout);
              resolve(null);
              sub.close();
            },
          }
        );
      });

      relay.close();
      if (profile) return profile;
    } catch (e) {
      console.warn(`Failed to connect to ${url}:`, e);
    }
  }
  return null;
}

export async function checkNip07(): Promise<boolean> {
  return typeof window !== 'undefined' && !!(window as any).nostr;
}

export async function loginWithNip07(): Promise<string> {
  const nostr = (window as any).nostr;
  if (!nostr) throw new Error('No NIP-07 extension found');
  const pubkey = await nostr.getPublicKey();
  return pubkey;
}

export { generateSecretKey, getPublicKey, finalizeEvent };
