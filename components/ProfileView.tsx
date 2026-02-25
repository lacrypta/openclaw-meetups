"use client";

import type { NostrProfile } from "../lib/nostr";
import { npubEncode } from "../lib/nostr";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  pubkey: string;
  profile: NostrProfile | null;
  loading: boolean;
  method: string | null;
  onLogout: () => void;
}

export function ProfileView({ pubkey, profile, loading, method, onLogout }: Props) {
  const npub = npubEncode(pubkey);
  const shortNpub = npub.slice(0, 16) + "..." + npub.slice(-8);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-5">
        <Card className="max-w-[440px] w-full p-0 overflow-hidden">
          {/* Banner skeleton */}
          <Skeleton className="h-[120px] w-full rounded-none" />
          {/* Avatar skeleton */}
          <div className="flex justify-center -mt-10">
            <Skeleton className="w-20 h-20 rounded-full border-4 border-card" />
          </div>
          {/* Name / nip05 / npub skeletons */}
          <div className="flex flex-col items-center gap-2 px-6 pt-3 pb-6">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-56" />
            <Skeleton className="h-10 w-full mt-4 rounded-none rounded-b-lg" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-5">
      <Card className="max-w-[440px] w-full p-0 overflow-hidden shadow-[0_0_40px_rgba(124,58,237,0.15)]">
        {profile?.banner ? (
          <div
            className="h-[120px] bg-cover bg-center"
            style={{ backgroundImage: `url(${profile.banner})` }}
          />
        ) : (
          <div className="h-[120px] bg-gradient-to-br from-primary to-accent" />
        )}

        <div className="flex justify-center -mt-10">
          <Avatar className="w-20 h-20 border-4 border-card">
            {profile?.picture ? (
              <AvatarImage src={profile.picture} alt="avatar" />
            ) : (
              <AvatarFallback className="text-4xl">👤</AvatarFallback>
            )}
          </Avatar>
        </div>

        <h1 className="text-foreground text-center text-2xl font-bold mt-3 mb-1 px-6">
          {profile?.display_name || profile?.name || "Anon"}
        </h1>

        {profile?.nip05 && (
          <p className="text-success text-center text-[13px] mb-1">
            ✅ {profile.nip05}
          </p>
        )}

        <p className="text-muted-foreground/60 text-center text-xs font-mono mb-2" title={npub}>
          {shortNpub}
        </p>

        <div className="text-center mb-4 text-[13px] text-muted-foreground">
          {method === "nip07" && "🔌 NIP-07"}
          {method === "nsec" && "🔑 nsec"}
          {method === "bunker" && "🔐 Bunker"}
        </div>

        {profile?.about && (
          <p className="text-foreground/80 text-sm leading-relaxed px-6 mb-4">
            {profile.about}
          </p>
        )}

        {profile?.lud16 && (
          <div className="flex items-center justify-center gap-1.5 px-6 py-2.5 bg-secondary text-warning text-sm font-medium">
            <span className="text-lg">⚡</span>
            <span>{profile.lud16}</span>
          </div>
        )}

        {!profile && (
          <p className="text-muted-foreground/60 text-center text-sm px-6 mb-4">
            No se encontró perfil (kind:0) en los relays.
          </p>
        )}

        <Button
          variant="destructive"
          className="w-full rounded-none rounded-b-lg"
          onClick={onLogout}
        >
          Cerrar sesión
        </Button>
      </Card>
    </div>
  );
}
