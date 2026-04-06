"use client";

import meetupConfig from "../config/meetup.json";

const MEETUP_DATE =
  process.env.NEXT_PUBLIC_MEETUP_DATE ?? meetupConfig.nextMeetupDate;

const LUMA_URL = "https://luma.com/openclaw2";

export function ScheduleSection() {
  const nextDate = new Date(MEETUP_DATE);

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
            Próximo evento
          </div>
          <span className="text-white/30 text-[13px] font-['Fragment_Mono',monospace]">(002)</span>
        </div>

        {/* Giant heading */}
        <h2 className="text-white font-bold text-[48px] sm:text-[72px] md:text-[96px] lg:text-[120px] leading-[0.95] tracking-[-0.04em] mb-6">
          Agenda.
        </h2>

        <p className="text-white/50 text-base md:text-lg max-w-lg mb-16">
          Segundo encuentro de la comunidad OpenClaw en Buenos Aires. De asistente a entidad.
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
              <p className="text-white text-xl font-bold mt-1">19:00 - 23:00 hs (ART)</p>
            </div>
            <div>
              <span className="text-white/40 text-xs font-medium uppercase tracking-wide">Lugar</span>
              <p className="text-white text-xl font-bold mt-1">La Crypta</p>
              <p className="text-white/50 text-sm mt-0.5">Villanueva 1367, Belgrano, Buenos Aires</p>
            </div>
            <div>
              <span className="text-white/40 text-xs font-medium uppercase tracking-wide">Entrada</span>
              <p className="text-white text-xl font-bold mt-1">Gratuita</p>
              <p className="text-white/40 text-sm mt-0.5">Cupos limitados</p>
            </div>

            {/* CTA */}
            <a
              href={LUMA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 bg-[#C04040] text-white px-8 py-4 rounded-full text-base font-bold transition-all hover:bg-[#d04848] hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(192,64,64,0.4)] w-fit"
            >
              Reservá tu lugar ⚡
            </a>
          </div>

          {/* Right - Agenda timeline */}
          <div>
            <h3 className="text-white text-xl font-bold mb-8">Programa.</h3>
            <div className="flex flex-col gap-6">
              <div className="flex items-start gap-4 pb-6 border-b border-white/[0.08]">
                <span className="text-[#C04040] text-sm font-bold font-['Fragment_Mono',monospace] min-w-[60px]">19:00</span>
                <div>
                  <span className="text-white text-base font-semibold">Apertura & networking</span>
                  <p className="text-white/40 text-sm mt-1">
                    Llegada, birra, y conectar con la comunidad.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 pb-6 border-b border-white/[0.08]">
                <span className="text-[#C04040] text-sm font-bold font-['Fragment_Mono',monospace] min-w-[60px]">19:20</span>
                <div>
                  <span className="text-white text-base font-semibold">Bloque 1 — Charlas</span>
                  <p className="text-white/40 text-sm mt-1">
                    Charlas principales de la comunidad OpenClaw.
                  </p>
                  <span className="inline-flex items-center gap-1.5 mt-2 text-[#C04040] text-xs font-semibold bg-[#C04040]/10 px-3 py-1 rounded-full">
                    🎤 Charlas principales
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-4 pb-6 border-b border-white/[0.08]">
                <span className="text-[#C04040] text-sm font-bold font-['Fragment_Mono',monospace] min-w-[60px]">21:00</span>
                <div>
                  <span className="text-white text-base font-semibold">Corte — Shawarma & barra</span>
                  <p className="text-white/40 text-sm mt-1">
                    45 minutos para comer, tomar algo y conectar.
                  </p>
                  <span className="inline-flex items-center gap-1.5 mt-2 text-[#C04040] text-xs font-semibold bg-[#C04040]/10 px-3 py-1 rounded-full">
                    🥙 Shawarma + 🍺 Barra
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-4 pb-6 border-b border-white/[0.08]">
                <span className="text-[#C04040] text-sm font-bold font-['Fragment_Mono',monospace] min-w-[60px]">21:45</span>
                <div>
                  <span className="text-white text-base font-semibold">Bloque 2 — Hardware</span>
                  <p className="text-white/40 text-sm mt-1">
                    Segundo bloque de charlas enfocado en hardware y proyectos.
                  </p>
                  <span className="inline-flex items-center gap-1.5 mt-2 text-[#C04040] text-xs font-semibold bg-[#C04040]/10 px-3 py-1 rounded-full">
                    🔧 Hardware
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-[#C04040] text-sm font-bold font-['Fragment_Mono',monospace] min-w-[60px]">~23:00</span>
                <div>
                  <span className="text-white text-base font-semibold">Cierre & networking</span>
                  <p className="text-white/40 text-sm mt-1">
                    Conversar, preguntar, romper código, planear el próximo. Fogonero encendido 🔥
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
