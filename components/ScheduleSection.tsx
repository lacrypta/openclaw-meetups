"use client";

import { useTranslation } from "../i18n/useTranslation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import meetupConfig from "../config/meetup.json";

export function ScheduleSection() {
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

  const agendaItems = [
    { time: "19:00", label: lang === "es" ? "Puertas abiertas" : "Doors open", speaker: "", icon: "🚪" },
    { time: "20:00", label: lang === "es" ? "Bienvenida + La Crypta" : "Welcome + La Crypta", speaker: "Agustin Kassis", icon: "👋" },
    { time: "20:05", label: lang === "es" ? "Introducción a OpenClaw" : "Introduction to OpenClaw", speaker: "Cami Velasco", icon: "🦞" },
    { time: "20:20", label: lang === "es" ? "¿Cómo conocí a Claudio?" : "How I met Claudio", speaker: "Agustin Kassis", icon: "⚡" },
    { time: "20:35", label: lang === "es" ? "Charla iterativa con el público" : "Interactive talk with audience", speaker: "Camila Velasco & Agustin Kassis", icon: "💬" },
    { time: "21:00", label: lang === "es" ? "Charlas de 10-15 min + Workshop" : "10-15 min talks + Workshop", speaker: lang === "es" ? "El público" : "The audience", icon: "🎤" },
  ];

  return (
    <section id="schedule" className="py-20 bg-card">
      <div className="max-w-[1200px] mx-auto px-5 md:px-10">
        <h2 className="text-foreground text-[32px] font-extrabold text-center mb-12">
          {t.schedule.title}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Info card */}
          <Card className="bg-background p-8 flex flex-col gap-6 items-center text-center">
            <Badge className="bg-primary text-foreground px-6 py-2.5 text-sm font-bold uppercase tracking-wide">
              {lang === "es" ? "Primer Meetup en Argentina" : "First Meetup in Argentina"}
            </Badge>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground/60 text-xs font-semibold uppercase tracking-wide">
                {t.schedule.nextDate}
              </span>
              <span className="text-foreground text-xl font-bold capitalize">{formattedDate}</span>
              <span className="text-accent text-base font-semibold">19:00 - 22:00 hs (ART)</span>
            </div>
            <div className="text-success text-sm font-semibold">✓ {t.schedule.free}</div>
            <div className="bg-gradient-to-br from-accent to-primary px-6 py-4 rounded-xl flex flex-col items-center gap-1">
              <span className="text-white text-[32px] font-extrabold">20</span>
              <span className="text-white/90 text-xs font-medium">
                {lang === "es" ? "lugares disponibles de 100" : "spots available of 100"}
              </span>
            </div>
          </Card>

          {/* Agenda card */}
          <Card className="bg-background p-8">
            <h3 className="text-foreground text-lg font-bold mb-6">
              {lang === "es" ? "Itinerario" : "Schedule"}
            </h3>
            <div className="flex flex-col">
              {agendaItems.map((item, i) => (
                <div key={i} className="relative flex items-start gap-3 pl-5 pb-5">
                  <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-primary" />
                  {i < agendaItems.length - 1 && (
                    <div className="absolute left-1 top-[18px] w-0.5 h-[calc(100%-12px)] bg-border" />
                  )}
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-primary text-[13px] font-bold font-mono min-w-[44px]">
                        {item.time}
                      </span>
                      <span className="text-base">{item.icon}</span>
                      <span className="text-foreground text-sm font-semibold">{item.label}</span>
                    </div>
                    {item.speaker && (
                      <span className="text-muted-foreground/60 text-xs italic ml-[52px]">
                        — {item.speaker}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
