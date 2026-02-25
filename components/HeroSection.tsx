"use client";

import { useTranslation } from "../i18n/useTranslation";
import { Card } from "@/components/ui/card";
import meetupConfig from "../config/meetup.json";

export function HeroSection() {
  const { t, lang } = useTranslation();
  const nextDate = new Date(meetupConfig.nextMeetupDate);

  const formattedDate = nextDate.toLocaleDateString(
    lang === "es" ? "es-AR" : "en-US",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  return (
    <section className="relative flex items-center justify-center bg-background overflow-hidden pt-[144px] md:pt-[224px] min-h-[60vh]">
      {/* Background glow */}
      <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.15)_0%,rgba(232,121,168,0.05)_50%,transparent_70%)] pointer-events-none" />

      <div className="relative z-10 text-center max-w-[800px] px-5 md:px-10">
        <div className="flex items-center justify-center gap-4 mb-4">
          <img src="/openclaw-logo.png" alt="OpenClaw" className="w-16 h-16 object-contain" />
          <span className="text-2xl font-bold text-muted-foreground/60">x</span>
          <img src="/lacrypta-logo.png" alt="La Crypta" className="w-16 h-16 object-contain" />
        </div>

        <h1 className="text-foreground font-extrabold leading-tight mb-2 text-4xl md:text-[56px]">
          {t.hero.title}
        </h1>
        <p className="text-muted-foreground font-normal mb-3 text-lg md:text-2xl">
          {t.hero.subtitle}
        </p>
        <p className="text-accent text-sm font-semibold tracking-wide uppercase mb-10">
          {t.hero.tagline}
        </p>

        <Card className="inline-flex flex-col gap-1 px-8 py-5 mb-8">
          <span className="text-muted-foreground/60 text-xs font-semibold uppercase tracking-wide">
            {t.hero.nextMeetup}
          </span>
          <span className="text-foreground text-xl font-bold capitalize">
            {formattedDate}
          </span>
          <span className="text-accent text-sm font-semibold">19:00 hs (ART)</span>
        </Card>
      </div>
    </section>
  );
}
