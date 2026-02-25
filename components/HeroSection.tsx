"use client";

import { useEffect, useRef } from "react";
import meetupConfig from "../config/meetup.json";

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
  const nextDate = new Date(meetupConfig.nextMeetupDate);

  const formattedDate = nextDate.toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <section className="relative min-h-screen bg-[#121212] overflow-hidden pt-16 flex flex-col justify-between">
      {/* Giant OpenClaw logo - parallax background */}
      <img
        ref={logoRef}
        src="/openclaw-logo.png"
        alt=""
        aria-hidden="true"
        className="absolute top-[50%] left-[60%] w-[500px] h-[500px] md:w-[700px] md:h-[700px] lg:w-[900px] lg:h-[900px] object-contain opacity-[0.04] pointer-events-none select-none will-change-transform"
        style={{ transform: "translate(-50%, -50%) rotate(-12deg)" }}
      />

      {/* Background halftone atmosphere */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-[radial-gradient(circle_at_70%_30%,#333_0%,transparent_70%)]" />
        <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-[radial-gradient(circle_at_30%_70%,#222_0%,transparent_60%)]" />
      </div>

      {/* Cross markers top */}
      <div className="cross-markers pt-8 px-8">
        <span>+</span><span>+</span><span>+</span><span>+</span>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row items-start justify-between max-w-[1400px] mx-auto px-6 md:px-12 py-16 md:py-24 gap-12">
        {/* Left side - Brand */}
        <div className="flex-1">
          <h1 className="text-white font-bold leading-[0.95] tracking-[-0.04em] text-[64px] sm:text-[100px] md:text-[140px] lg:text-[180px]">
            OpenClaw
            <br />
            <span className="text-[0.55em] font-bold text-white/80">Meetups.</span>
          </h1>

          <p className="mt-8 md:mt-12 text-white/60 text-base md:text-lg max-w-md leading-relaxed">
            Tu propio asistente de IA personal,{" "}
            <span className="text-white font-semibold italic">
              open-source y corriendo en tu maquina.
            </span>
          </p>

          <div className="mt-6">
            <span className="text-white/40 text-[13px]">
              &copy; {new Date().getFullYear()} La Crypta
            </span>
          </div>
        </div>

        {/* Right side - Services + info */}
        <div className="flex flex-col gap-8 md:items-end md:text-right">
          <div className="flex flex-col gap-3">
            <span className="text-white text-base font-medium">Experiencias IRL</span>
            <span className="text-white text-base font-medium">Open Source AI</span>
            <span className="text-white text-base font-medium">Comunidad</span>
            <span className="text-white text-base font-medium">Bitcoin & Nostr</span>
          </div>

          {/* Next event card */}
          <div className="bg-white rounded-2xl p-6 max-w-xs">
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
                Proximo meetup
              </span>
              <p className="text-[#171717] text-sm font-bold capitalize mt-1">
                {formattedDate}
              </p>
              <p className="text-[#737373] text-sm mt-0.5">19:00 hs (ART)</p>
            </div>
            <a
              href="#contacto"
              className="btn-pill mt-4 w-full justify-center text-sm"
            >
              Quiero participar <span className="dot" />
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
