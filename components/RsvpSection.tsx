"use client";

import { useTranslation } from "../i18n/useTranslation";
import { useRsvp } from "../hooks/useRsvp";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { NostrProfile } from "../lib/nostr";

interface Props {
  pubkey: string | null;
  profile: NostrProfile | null;
  onLoginClick: () => void;
}

export function RsvpSection({ pubkey, profile, onLoginClick }: Props) {
  const { t } = useTranslation();
  const { isAttending, attendeeCount, toggleRsvp } = useRsvp(pubkey);

  return (
    <section id="rsvp" className="py-20 bg-card">
      <div className="max-w-[600px] mx-auto px-5 md:px-10">
        <h2 className="text-foreground text-[32px] font-extrabold text-center mb-12">
          {t.rsvp.title}
        </h2>

        {!pubkey ? (
          <Card className="bg-background p-10 text-center">
            <div className="text-4xl mb-4">🔐</div>
            <p className="text-foreground text-lg font-bold mb-2">{t.rsvp.loginPrompt}</p>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              {t.rsvp.loginDesc}
            </p>
            <Button size="lg" onClick={onLoginClick}>
              ⚡ {t.hero.ctaLogin}
            </Button>
          </Card>
        ) : (
          <Card className="bg-background p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Avatar className="w-10 h-10">
                {profile?.picture ? (
                  <AvatarImage src={profile.picture} alt="" />
                ) : null}
                <AvatarFallback>👤</AvatarFallback>
              </Avatar>
              <span className="text-foreground text-base font-semibold">
                {profile?.display_name || profile?.name || "Anon"}
              </span>
            </div>

            {isAttending ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-success/15 text-success flex items-center justify-center text-2xl font-bold">
                  ✓
                </div>
                <p className="text-success text-lg font-bold">{t.rsvp.attending}</p>
                <Button variant="outline" size="sm" onClick={toggleRsvp}>
                  {t.rsvp.cancelAttend}
                </Button>
              </div>
            ) : (
              <Button
                className="w-full max-w-[300px] bg-accent hover:bg-accent/80"
                size="lg"
                onClick={toggleRsvp}
              >
                🦞 {t.rsvp.confirmAttend}
              </Button>
            )}

            {attendeeCount > 0 && (
              <p className="text-muted-foreground/60 text-[13px] mt-4">
                {attendeeCount} {t.rsvp.confirmed.toLowerCase()}
              </p>
            )}
          </Card>
        )}
      </div>
    </section>
  );
}
