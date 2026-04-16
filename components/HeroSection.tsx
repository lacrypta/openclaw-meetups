"use client";

import { useEffect, useRef } from "react";

export function HeroSection() {
  const logoRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!logoRef.current) return;
      const scrollY = window.scrollY;
      const translateY = scrollY * 0.3;
      const rotate = -12 + scrollY * 0.02;
      logoRef.current.style.transform = `translate(-50%, -50%) rotate(${rotate}deg) translateY(${translateY}px)`;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="relative min-h-screen bg-[#121212] overflow-hidden pt-16 flex flex-col justify-between">
      {/* Giant OpenClaw logo - parallax background */}
      <img
        ref={logoRef}
        src="/openclaw-logo.png"
        alt=""
        aria-hidden="true"
        className="absolute top-[50%] left-[60%] w-[500px] h-[500px] md:w-[700px] md:h-[700px] lg:w-[900px] lg:h-[900px] object-contain opacity-[0.06] pointer-events-none select-none will-change-transform"
        style={{ transform: "translate(-50%, -50%) rotate(-12deg)" }}
      />

      {/* Accent glow */}
      <div className="absolute top-[30%] left-[40%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(192,64,64,0.08)_0%,transparent_70%)] pointer-events-none" />

      {/* Cross markers top */}
      <div className="cross-markers pt-8 px-8">
        <span>+</span><span>+</span><span>+</span><span>+</span>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-start justify-between max-w-[1400px] mx-auto px-6 md:px-12 py-16 md:py-24 gap-12">
        {/* Left side - Brand */}
        <div className="flex-1">
          {/* Event badge */}
          <div className="inline-flex items-center gap-2 bg-[#C04040]/15 border border-[#C04040]/30 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 rounded-full bg-[#C04040]" />
            <span className="text-[#C04040] text-sm font-semibold tracking-wide">Evento finalizado · +180 asistentes</span>
          </div>

          <h1 className="text-white font-bold leading-[0.95] tracking-[-0.04em] text-[56px] sm:text-[80px] md:text-[100px] lg:text-[130px] xl:text-[170px]">
            ¡Gracias!
            <br />
            <span className="text-[0.55em] font-bold text-white/80">A toda la comunidad.</span>
          </h1>

          <p className="mt-8 md:mt-12 text-white/60 text-base md:text-lg max-w-md leading-relaxed">
            Más de 180 personas se sumaron al segundo meetup de OpenClaw.{" "}
            <span className="text-white font-semibold italic">
              Gracias a cada quien que hizo posible esta noche.
            </span>
          </p>

          {/* CTA primary */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <a
              href="#experiencias"
              className="inline-flex items-center justify-center gap-3 bg-[#C04040] text-white px-8 py-4 rounded-full text-base font-bold transition-all hover:bg-[#d04848] hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(192,64,64,0.4)]"
            >
              Ver el recap ⚡
            </a>
            <a
              href="https://lacrypta.ar"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 bg-white/10 text-white px-6 py-4 rounded-full text-base font-medium transition-all hover:bg-white/15 border border-white/10"
            >
              Sumate a la comunidad
            </a>
          </div>

          <div className="mt-6">
            <span className="text-white/40 text-[13px]">
              &copy; {new Date().getFullYear()} La Crypta
            </span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex flex-col gap-8 lg:items-end lg:text-right w-full lg:w-[340px] lg:flex-shrink-0">
          {/* Attendance stat card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-8 w-full flex flex-col items-center text-center">
            <span className="text-white/40 text-xs font-medium uppercase tracking-widest">
              Asistentes
            </span>
            <span className="text-white text-6xl md:text-7xl font-bold font-['Fragment_Mono',monospace] tabular-nums mt-3">
              +180
            </span>
            <span className="text-white/50 text-sm mt-3 max-w-[240px]">
              personas llenaron La Crypta para la segunda edición
            </span>
          </div>

          <div className="flex flex-col gap-3 lg:items-end">
            <span className="text-white text-base font-medium">🎤 Bloque 1 — Charlas ✓</span>
            <span className="text-white text-base font-medium">🔧 Bloque 2 — Hardware ✓</span>
            <span className="text-white text-base font-medium">🥙 Shawarma & barra ✓</span>
            <span className="text-white text-base font-medium">🔥 Fogonero & networking ✓</span>
          </div>

          {/* Organizer card */}
          <div className="bg-white rounded-2xl p-6 w-full">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-[#f5f5f5] flex items-center justify-center flex-shrink-0">
                <img
                  src="/lacrypta-logo.png"
                  alt="La Crypta"
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[#737373] text-[13px] font-medium">Organizador</span>
                <span className="text-[#171717] text-sm font-bold">La Crypta</span>
                <span className="text-[#737373] text-[13px]">Buenos Aires</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[#e5e5e5]">
              <span className="text-[#737373] text-xs font-medium uppercase tracking-wide">
                Próximo meetup
              </span>
              <p className="text-[#171717] text-sm font-bold mt-1">
                Muy pronto
              </p>
              <p className="text-[#737373] text-sm mt-0.5">Seguinos para enterarte primero</p>
            </div>
            <a
              href="https://lacrypta.ar"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 w-full justify-center text-sm inline-flex items-center gap-2 bg-[#171717] text-white px-5 py-3 rounded-full font-semibold transition-all hover:bg-[#333]"
            >
              Visitar lacrypta.ar <span className="w-2 h-2 rounded-full bg-white" />
            </a>
          </div>
        </div>
      </div>

      {/* Cross markers bottom */}
      <div className="cross-markers pb-8 px-8">
        <span>+</span><span>+</span><span>+</span><span>+</span>
      </div>
    </section>
  );
}
