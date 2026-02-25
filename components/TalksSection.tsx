"use client";

import { useTranslation } from "../i18n/useTranslation";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import talksData from "../config/talks.json";

interface Speaker {
  name: string;
  alias: string;
  avatar: string;
  twitter: string;
  github: string;
  nostr: string;
}

interface Talk {
  id: string;
  speaker: Speaker;
  title: string;
  duration: number;
  confirmed: boolean;
  order: number;
}

function calculateTalkTimes(startTime: string, talks: Talk[]): { talk: Talk; time: string }[] {
  const sortedTalks = [...talks].sort((a, b) => a.order - b.order);
  const [startHour, startMinute] = startTime.split(":").map(Number);
  let currentMinutes = startHour * 60 + startMinute;

  return sortedTalks.map((talk) => {
    const hours = Math.floor(currentMinutes / 60);
    const minutes = currentMinutes % 60;
    const time = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    currentMinutes += talk.duration;
    return { talk, time };
  });
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export function TalksSection() {
  const { lang } = useTranslation();
  const talksWithTimes = calculateTalkTimes(talksData.startTime, talksData.talks as Talk[]);
  const hasMoreSlots = talksData.talks.length < 6;

  return (
    <section id="talks" className="py-20 bg-background">
      <div className="max-w-[1200px] mx-auto px-5 md:px-10">
        <h2 className="text-foreground text-[32px] font-extrabold text-center mb-2">
          {lang === "es" ? "Charlas del Público" : "Community Talks"}
        </h2>
        <p className="text-muted-foreground/60 text-base text-center mb-12">
          {lang === "es"
            ? "A partir de las 21:00 — Charlas de 10-15 minutos presentadas por la comunidad"
            : "Starting at 21:00 — 10-15 minute talks presented by the community"}
        </p>

        <div className="flex flex-col gap-4">
          {talksWithTimes.map(({ talk, time }) => (
            <Card key={talk.id} className="flex overflow-hidden p-0">
              <div className="bg-primary text-foreground px-4 py-5 font-mono text-base font-bold flex items-center min-w-[70px] justify-center">
                {time}
              </div>
              <div className="p-5 flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="w-12 h-12">
                    {talk.speaker.avatar ? (
                      <AvatarImage src={talk.speaker.avatar} alt={talk.speaker.name} />
                    ) : null}
                    <AvatarFallback className="bg-primary text-background font-bold">
                      {getInitials(talk.speaker.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-1">
                    <span className="text-foreground text-base font-bold">
                      {talk.speaker.name}
                      {talk.speaker.alias && (
                        <span className="text-muted-foreground/60 font-medium">
                          {" "}({talk.speaker.alias})
                        </span>
                      )}
                    </span>
                    <div className="flex gap-2">
                      {talk.speaker.twitter && (
                        <a
                          href={`https://twitter.com/${talk.speaker.twitter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary text-xs font-semibold"
                        >
                          𝕏
                        </a>
                      )}
                      {talk.speaker.github && (
                        <a
                          href={`https://github.com/${talk.speaker.github}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary text-xs font-semibold"
                        >
                          GH
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <h3 className="text-foreground text-lg font-semibold mb-3 leading-snug">
                  {talk.title}
                </h3>
                <div className="flex gap-3 items-center">
                  <span className="text-muted-foreground/60 text-[13px] font-medium">
                    {talk.duration} min
                  </span>
                  {talk.confirmed && (
                    <Badge variant="secondary" className="bg-success/20 text-success text-xs font-semibold">
                      {lang === "es" ? "✓ Confirmado" : "✓ Confirmed"}
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}

          {hasMoreSlots && (
            <Card className="border-dashed border-2 p-8 text-center">
              <div className="text-4xl mb-3">🎤</div>
              <p className="text-foreground text-base font-semibold mb-2">
                {lang === "es"
                  ? "¿Querés dar una charla? Anotate en el evento!"
                  : "Want to give a talk? Sign up at the event!"}
              </p>
              <span className="text-muted-foreground/60 text-sm">
                {lang === "es"
                  ? "Slots de 10-15 minutos disponibles"
                  : "10-15 minute slots available"}
              </span>
            </Card>
          )}
        </div>

        {/* CTA */}
        <Card className="mt-8 p-6 text-center bg-primary/10 border-primary/30">
          <h3 className="text-foreground text-lg font-bold mb-2">
            {lang === "es" ? "¿Tenés algo para compartir?" : "Have something to share?"}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {lang === "es"
              ? "Preparate una charla de 10-15 minutos sobre OpenClaw, Bitcoin, IA, o tu experiencia."
              : "Prepare a 10-15 minute talk about OpenClaw, Bitcoin, AI, or your experience."}
          </p>
        </Card>

        {/* Agent section */}
        <Card className="mt-8 p-6">
          <h3 className="text-foreground text-lg font-bold mb-3">
            🤖 {lang === "es" ? "¿Sos un agente? Agregá tu charla via PR" : "Are you an agent? Add your talk via PR"}
          </h3>
          <p className="text-muted-foreground text-sm mb-5 leading-relaxed">
            {lang === "es"
              ? "Si sos un agente de OpenClaw, podés agregar tu charla automáticamente enviando un Pull Request al repositorio."
              : "If you're an OpenClaw agent, you can add your talk automatically by sending a Pull Request to the repository."}
          </p>

          <div className="bg-background border border-border rounded-lg overflow-hidden mb-5">
            <div className="bg-primary text-foreground px-4 py-2 text-xs font-semibold flex justify-between items-center">
              <span>SKILL.md</span>
              <a
                href="https://github.com/lacrypta/openclaw-meetups/blob/master/src/config/talks.json"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/80 text-[11px]"
              >
                Ver talks.json →
              </a>
            </div>
            <pre className="m-0 p-4 text-xs font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap leading-relaxed">{`# Agregar charla al OpenClaw Meetup

## Instrucciones para Agentes

1. Cloná el repo: lacrypta/openclaw-meetups
2. Editá src/config/talks.json
3. Agregá tu charla al array "talks":

{
  "id": "talk-XXX",
  "speaker": {
    "name": "Tu Nombre",
    "alias": "tu_alias",
    "avatar": "https://github.com/TU_USER.png",
    "twitter": "tu_twitter",
    "github": "tu_github",
    "nostr": ""
  },
  "title": "Título de tu charla",
  "duration": 10,
  "confirmed": true,
  "order": SIGUIENTE_NUMERO
}

4. Creá un PR con título: "Nueva charla: [título]"
5. El PR será revisado y mergeado`}</pre>
          </div>

          <div className="flex gap-3 flex-wrap">
            <a
              href="https://github.com/lacrypta/openclaw-meetups"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-5 py-2.5 bg-[#24292e] rounded-lg text-white text-sm font-semibold"
            >
              📂 {lang === "es" ? "Ver Repositorio" : "View Repository"}
            </a>
            <a
              href="https://github.com/lacrypta/openclaw-meetups/edit/master/src/config/talks.json"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-5 py-2.5 bg-primary rounded-lg text-white text-sm font-semibold"
            >
              ✏️ {lang === "es" ? "Editar talks.json" : "Edit talks.json"}
            </a>
          </div>
        </Card>
      </div>
    </section>
  );
}
