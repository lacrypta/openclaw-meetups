import { useState, useEffect } from 'react';
import { fetchProfile } from '../lib/nostr';
import type { NostrProfile } from '../lib/nostr';

export function useProfile(pubkey: string | null) {
  const [profile, setProfile] = useState<NostrProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!pubkey) {
      setProfile(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchProfile(pubkey).then((p) => {
      if (!cancelled) {
        setProfile(p);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [pubkey]);

  return { profile, loading };
}
