"use client";

const LUMA_URL = "https://luma.com/openclaw2";

export function AboutSection() {
  return (
    <section id="about" className="py-24 md:py-32 bg-[#f5f5f5]">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        {/* Section label */}
        <div className="section-label mb-8">Nosotros</div>

        {/* Giant heading */}
        <h2 className="text-[#171717] font-bold text-[48px] sm:text-[72px] md:text-[96px] lg:text-[120px] leading-[0.95] tracking-[-0.04em] mb-16">
          Nosotros.
        </h2>

        {/* Two column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 mb-20">
          {/* Left column */}
          <div>
            <p className="text-[#171717] text-xl md:text-2xl font-bold leading-snug mb-6">
              Somos una comunidad que une inteligencia artificial open-source con la cultura Bitcoin y Nostr.
            </p>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-6">
            <p className="text-[#737373] text-base md:text-lg leading-relaxed">
              OpenClaw es tu asistente de IA personal, open-source, que corre localmente en tu máquina. No necesitás depender de servicios de terceros ni entregar tus datos a nadie.
            </p>
            <p className="text-[#737373] text-base md:text-lg leading-relaxed">
              La Crypta es un espacio comunitario en Buenos Aires dedicado a Bitcoin, Nostr y tecnologías libres. Juntos creamos encuentros donde la tecnología se vive en primera persona.
            </p>
            <a href="#experiencias" className="btn-pill w-fit">
              Ver agenda <span className="dot" />
            </a>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12 border-t border-[#e5e5e5]">
          <div>
            <span className="text-[#171717] text-[48px] md:text-[64px] font-bold leading-none">2</span>
            <p className="text-[#737373] text-[13px] mt-2 leading-snug">
              Meetups organizados
            </p>
          </div>
          <div>
            <span className="text-[#171717] text-[48px] md:text-[64px] font-bold leading-none">5+</span>
            <p className="text-[#737373] text-[13px] mt-2 leading-snug">
              Charlas y demos realizadas
            </p>
          </div>
          <div>
            <span className="text-[#171717] text-[48px] md:text-[64px] font-bold leading-none">75</span>
            <p className="text-[#737373] text-[13px] mt-2 leading-snug">
              Personas en el primer evento
            </p>
          </div>
          <div>
            <span className="text-[#171717] text-[48px] md:text-[64px] font-bold leading-none">100%</span>
            <p className="text-[#737373] text-[13px] mt-2 leading-snug">
              Gratuito y abierto a todos
            </p>
          </div>
        </div>

        {/* Speakers highlight */}
        <div className="mt-20 bg-[#121212] rounded-3xl p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[radial-gradient(circle,rgba(192,64,64,0.1)_0%,transparent_70%)] pointer-events-none" />
          <div className="relative z-10">
            <span className="text-[#C04040] text-xs font-bold uppercase tracking-widest">Speakers destacados</span>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Agustin */}
              <div className="flex gap-5 items-start">
                <img
                  src="/speaker-agustin.jpg"
                  alt="Agustin Kassis"
                  className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 border border-white/10"
                />
                <div>
                  <p className="text-white font-bold text-lg leading-tight">Agustin Kassis</p>
                  <p className="text-[#C04040] text-sm font-semibold mt-0.5">Fundador de La Crypta</p>
                  <p className="text-white/50 text-sm leading-relaxed mt-2">
                    &quot;Humano Digital&quot; — De asistente a entidad: el camino desde mandar mails hasta construir un ser digital autónomo que trabaja, cobra y piensa. Demo en vivo con Claudio.
                  </p>
                </div>
              </div>

              {/* Cami */}
              <div className="flex gap-5 items-start">
                <img
                  src="/speaker-cami.jpg"
                  alt="Camila Velasco"
                  className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 border border-white/10"
                />
                <div>
                  <p className="text-white font-bold text-lg leading-tight">Camila Velasco</p>
                  <p className="text-[#C04040] text-sm font-semibold mt-0.5">Co-fundadora de Spark101</p>
                  <p className="text-white/50 text-sm leading-relaxed mt-2">
                    &quot;La Era de la Langosta&quot; — Ecosistema OpenClaw, comunidad y el futuro de los agentes de IA desde una perspectiva humana.
                  </p>
                </div>
              </div>
            </div>

            <a
              href={LUMA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-[#C04040] text-white px-7 py-3.5 rounded-full text-sm font-bold transition-all hover:bg-[#d04848] hover:shadow-[0_0_24px_rgba(192,64,64,0.35)] mt-8"
            >
              No te lo pierdas ⚡
            </a>
          </div>
        </div>

        {/* Logos */}
        <div className="mt-20">
          <div className="flex items-center justify-between mb-8">
            <div className="section-label">Organizan</div>
            <span className="text-[#737373] text-[13px]">(2025 - 2026)</span>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white rounded-2xl px-8 py-5 flex items-center gap-3">
              <img src="/openclaw-logo.png" alt="OpenClaw" className="w-8 h-8 object-contain" />
              <span className="text-[#171717] text-base font-semibold">OpenClaw</span>
            </div>
            <div className="bg-white rounded-2xl px-8 py-5 flex items-center gap-3">
              <img src="/lacrypta-logo.png" alt="La Crypta" className="w-8 h-8 object-contain" />
              <span className="text-[#171717] text-base font-semibold">La Crypta</span>
            </div>
            <div className="bg-white rounded-2xl px-8 py-5 flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <span className="text-[#171717] text-base font-semibold">Spark101</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
