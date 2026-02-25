"use client";

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
  const talksWithTimes = calculateTalkTimes(talksData.startTime, talksData.talks as Talk[]);
  const hasMoreSlots = talksData.talks.length < 6;

  return (
    <section id="talks" className="py-24 md:py-32 bg-[#f5f5f5]">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        {/* Section label */}
        <div className="flex items-center justify-between mb-8">
          <div className="section-label">Charlas</div>
          <span className="text-[#737373] text-[13px] font-['Fragment_Mono',monospace]">
            ({String(talksData.talks.length).padStart(2, "0")})
          </span>
        </div>

        {/* Heading */}
        <h2 className="text-[#171717] font-bold text-[48px] sm:text-[72px] md:text-[96px] leading-[0.95] tracking-[-0.04em] mb-4">
          Charlas.
        </h2>
        <p className="text-[#737373] text-base md:text-lg max-w-lg mb-16">
          A partir de las 21:00 — Charlas de 10-15 minutos presentadas por la comunidad.
        </p>

        {/* Talks list */}
        <div className="flex flex-col">
          {talksWithTimes.map(({ talk, time }, i) => (
            <div
              key={talk.id}
              className="flex items-start gap-6 md:gap-10 py-8 border-b border-[#e5e5e5] first:border-t first:border-[#e5e5e5]"
            >
              {/* Index */}
              <span className="mono-index min-w-[40px] pt-1">
                ({String(i + 1).padStart(3, "0")})
              </span>

              {/* Time */}
              <span className="text-[#737373] text-[13px] font-['Fragment_Mono',monospace] min-w-[48px] pt-1">
                {time}
              </span>

              {/* Speaker avatar */}
              <div className="w-12 h-12 rounded-full bg-[#e5e5e5] flex items-center justify-center flex-shrink-0 overflow-hidden">
                {talk.speaker.avatar ? (
                  <img
                    src={talk.speaker.avatar}
                    alt={talk.speaker.name}
                    className="w-full h-full object-cover halftone"
                  />
                ) : (
                  <span className="text-[#737373] text-sm font-bold">
                    {getInitials(talk.speaker.name)}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="text-[#171717] text-lg md:text-xl font-bold leading-snug mb-2">
                  {talk.title}
                </h3>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[#171717] text-sm font-semibold">
                    {talk.speaker.name}
                    {talk.speaker.alias && (
                      <span className="text-[#737373] font-normal"> ({talk.speaker.alias})</span>
                    )}
                  </span>
                  <span className="text-[#737373] text-[13px]">{talk.duration} min</span>
                  {talk.confirmed && (
                    <span className="text-[#171717] text-xs font-medium bg-[#e5e5e5] px-3 py-1 rounded-full">
                      Confirmado
                    </span>
                  )}
                </div>
                {/* Social links */}
                <div className="flex gap-3 mt-2">
                  {talk.speaker.twitter && (
                    <a
                      href={`https://twitter.com/${talk.speaker.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#737373] text-xs font-medium hover:text-[#171717] transition-colors"
                    >
                      X
                    </a>
                  )}
                  {talk.speaker.github && (
                    <a
                      href={`https://github.com/${talk.speaker.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#737373] text-xs font-medium hover:text-[#171717] transition-colors"
                    >
                      GitHub
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Open slots */}
        {hasMoreSlots && (
          <div className="mt-8 py-8 border-2 border-dashed border-[#e5e5e5] rounded-2xl text-center">
            <p className="text-[#171717] text-lg font-bold mb-2">
              Quedan slots disponibles.
            </p>
            <p className="text-[#737373] text-sm mb-4">
              Preparate una charla de 10-15 minutos sobre OpenClaw, Bitcoin, IA, o tu experiencia.
            </p>
            <a href="#contacto" className="btn-pill inline-flex">
              Quiero dar una charla <span className="dot" />
            </a>
          </div>
        )}

        {/* Agent section */}
        <div className="mt-12 bg-white rounded-2xl p-8 md:p-10">
          <h3 className="text-[#171717] text-xl font-bold mb-3">
            Sos un agente? Agrega tu charla via PR.
          </h3>
          <p className="text-[#737373] text-sm mb-6 leading-relaxed max-w-lg">
            Si sos un agente de OpenClaw, podes agregar tu charla automaticamente enviando un Pull Request al repositorio.
          </p>

          <div className="bg-[#f5f5f5] rounded-xl overflow-hidden mb-6">
            <div className="bg-[#171717] text-white px-5 py-3 text-xs font-semibold flex justify-between items-center">
              <span>SKILL.md</span>
              <a
                href="https://github.com/lacrypta/openclaw-meetups/blob/master/config/talks.json"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 text-[11px] hover:text-white transition-colors"
              >
                Ver talks.json
              </a>
            </div>
            <pre className="m-0 p-5 text-xs font-['Fragment_Mono',monospace] text-[#737373] overflow-x-auto whitespace-pre-wrap leading-relaxed">{`# Agregar charla al OpenClaw Meetup

1. Clona el repo: lacrypta/openclaw-meetups
2. Edita config/talks.json
3. Agrega tu charla al array "talks"
4. Crea un PR con titulo: "Nueva charla: [titulo]"
5. El PR sera revisado y mergeado`}</pre>
          </div>

          <div className="flex gap-3 flex-wrap">
            <a
              href="https://github.com/lacrypta/openclaw-meetups"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-pill text-sm"
            >
              Ver Repositorio <span className="dot" />
            </a>
            <a
              href="https://github.com/lacrypta/openclaw-meetups/edit/master/config/talks.json"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-pill !bg-white !text-[#0a0a0a] !border !border-[#e5e5e5] text-sm"
            >
              Editar talks.json <span className="dot !bg-[#0a0a0a]" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
