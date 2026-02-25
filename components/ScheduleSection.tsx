"use client";

import meetupConfig from "../config/meetup.json";

export function ScheduleSection() {
  const nextDate = new Date(meetupConfig.nextMeetupDate);

  const formattedDate = nextDate.toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <section id="experiencias" className="dark-section bg-[#121212] rounded-t-[32px] py-24 md:py-32">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        {/* Section label */}
        <div className="flex items-center justify-between mb-8">
          <div className="section-label !text-white/50">
            Proximo evento
          </div>
          <span className="text-white/30 text-[13px] font-['Fragment_Mono',monospace]">(002)</span>
        </div>

        {/* Giant heading */}
        <h2 className="text-white font-bold text-[48px] sm:text-[72px] md:text-[96px] lg:text-[120px] leading-[0.95] tracking-[-0.04em] mb-6">
          Experiencias.
        </h2>

        <p className="text-white/50 text-base md:text-lg max-w-lg mb-16">
          Encuentros mensuales donde la inteligencia artificial open-source se vive en primera persona.
        </p>

        {/* Event details grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          {/* Left - Event info */}
          <div className="flex flex-col gap-8">
            <div>
              <span className="text-white/40 text-xs font-medium uppercase tracking-wide">Fecha</span>
              <p className="text-white text-xl font-bold capitalize mt-1">{formattedDate}</p>
            </div>
            <div>
              <span className="text-white/40 text-xs font-medium uppercase tracking-wide">Horario</span>
              <p className="text-white text-xl font-bold mt-1">19:00 - 22:00 hs (ART)</p>
            </div>
            <div>
              <span className="text-white/40 text-xs font-medium uppercase tracking-wide">Lugar</span>
              <p className="text-white text-xl font-bold mt-1">La Crypta</p>
              <p className="text-white/50 text-sm mt-0.5">Villanueva 1367, Belgrano, Buenos Aires</p>
            </div>
            <div>
              <span className="text-white/40 text-xs font-medium uppercase tracking-wide">Entrada</span>
              <p className="text-white text-xl font-bold mt-1">Gratuita</p>
            </div>
          </div>

          {/* Right - What to expect */}
          <div>
            <h3 className="text-white text-xl font-bold mb-8">Que esperar.</h3>
            <div className="flex flex-col gap-6">
              <div className="flex items-start gap-4 pb-6 border-b border-white/[0.08]">
                <span className="mono-index !text-white/30 min-w-[40px]">(001)</span>
                <div>
                  <span className="text-white text-base font-semibold">Charlas de la comunidad</span>
                  <p className="text-white/40 text-sm mt-1">
                    Presentaciones de 10-15 minutos sobre OpenClaw, IA, Bitcoin y Nostr.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 pb-6 border-b border-white/[0.08]">
                <span className="mono-index !text-white/30 min-w-[40px]">(002)</span>
                <div>
                  <span className="text-white text-base font-semibold">Demos en vivo</span>
                  <p className="text-white/40 text-sm mt-1">
                    Demostraciones practicas de OpenClaw corriendo localmente.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 pb-6 border-b border-white/[0.08]">
                <span className="mono-index !text-white/30 min-w-[40px]">(003)</span>
                <div>
                  <span className="text-white text-base font-semibold">Workshop interactivo</span>
                  <p className="text-white/40 text-sm mt-1">
                    Espacio para que todos puedan experimentar y hacer preguntas.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="mono-index !text-white/30 min-w-[40px]">(004)</span>
                <div>
                  <span className="text-white text-base font-semibold">Networking</span>
                  <p className="text-white/40 text-sm mt-1">
                    Conecta con desarrolladores, entusiastas de IA y la comunidad Bitcoin.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-6 flex-wrap">
          <a href="#contacto" className="btn-pill !bg-white !text-[#0a0a0a]">
            Quiero participar <span className="dot !bg-[#0a0a0a]" />
          </a>
          <span className="text-white/30 text-sm">Cupos limitados</span>
        </div>
      </div>
    </section>
  );
}
