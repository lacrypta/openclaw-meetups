"use client";

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
              OpenClaw es tu asistente de IA personal, open-source, que corre localmente en tu maquina. No necesitas depender de servicios de terceros ni entregar tus datos a nadie.
            </p>
            <p className="text-[#737373] text-base md:text-lg leading-relaxed">
              La Crypta es un espacio comunitario en Buenos Aires dedicado a Bitcoin, Nostr y tecnologias libres. Juntos creamos encuentros donde la tecnologia se vive en primera persona.
            </p>
            <a href="#experiencias" className="btn-pill w-fit">
              Ver experiencias <span className="dot" />
            </a>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12 border-t border-[#e5e5e5]">
          <div>
            <span className="text-[#171717] text-[48px] md:text-[64px] font-bold leading-none">1</span>
            <p className="text-[#737373] text-[13px] mt-2 leading-snug">
              Meetup realizado exitosamente
            </p>
          </div>
          <div>
            <span className="text-[#171717] text-[48px] md:text-[64px] font-bold leading-none">4+</span>
            <p className="text-[#737373] text-[13px] mt-2 leading-snug">
              Charlas y presentaciones realizadas
            </p>
          </div>
          <div>
            <span className="text-[#171717] text-[48px] md:text-[64px] font-bold leading-none">75</span>
            <p className="text-[#737373] text-[13px] mt-2 leading-snug">
              Personas participaron en el primer evento
            </p>
          </div>
          <div>
            <span className="text-[#171717] text-[48px] md:text-[64px] font-bold leading-none">100%</span>
            <p className="text-[#737373] text-[13px] mt-2 leading-snug">
              Gratuito y abierto a todos
            </p>
          </div>
        </div>

        {/* Clients / Logos */}
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
