"use client";

import { useEffect, useRef, useState } from "react";
import meetupConfig from "../config/meetup.json";

const MEETUP_DATE =
  process.env.NEXT_PUBLIC_MEETUP_DATE ?? meetupConfig.nextMeetupDate;

const LUMA_URL = "https://luma.com/openclaw2";

function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = new Date(targetDate).getTime();
    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

export function HeroSection() {
  const logoRef = useRef<HTMLImageElement>(null);
  const countdown = useCountdown(MEETUP_DATE);

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

  const nextDate = new Date(MEETUP_DATE);
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
            <span className="w-2 h-2 rounded-full bg-[#C04040] animate-pulse" />
            <span className="text-[#C04040] text-sm font-semibold tracking-wide">2do Meetup · 27 Marzo</span>
          </div>

          <h1 className="text-white font-bold leading-[0.95] tracking-[-0.04em] text-[56px] sm:text-[80px] md:text-[100px] lg:text-[130px] xl:text-[170px]">
            OpenClaw
            <br />
            <span className="text-[0.55em] font-bold text-white/80">Meetups.</span>
          </h1>

          <p className="mt-8 md:mt-12 text-white/60 text-base md:text-lg max-w-md leading-relaxed">
            De asistente a entidad.{" "}
            <span className="text-white font-semibold italic">
              Construí tu propio ser digital autónomo.
            </span>
          </p>

          {/* CTA primary */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <a
              href={LUMA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 bg-[#C04040] text-white px-8 py-4 rounded-full text-base font-bold transition-all hover:bg-[#d04848] hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(192,64,64,0.4)]"
            >
              Reservá tu lugar ⚡
            </a>
            <a
              href="#experiencias"
              className="inline-flex items-center justify-center gap-3 bg-white/10 text-white/80 px-6 py-4 rounded-full text-base font-medium transition-all hover:bg-white/15 border border-white/10"
            >
              Ver agenda
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
          {/* Countdown */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: countdown.days, label: "días" },
              { value: countdown.hours, label: "hs" },
              { value: countdown.minutes, label: "min" },
              { value: countdown.seconds, label: "seg" },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center bg-white/5 border border-white/10 rounded-2xl px-3 py-3">
                <span className="text-white text-2xl md:text-3xl font-bold font-['Fragment_Mono',monospace] tabular-nums">
                  {String(value).padStart(2, "0")}
                </span>
                <span className="text-white/40 text-xs mt-1">{label}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-white text-base font-medium">🎤 Charla: &quot;Humano Digital&quot;</span>
            <span className="text-white text-base font-medium">🦞 &quot;La Era de la Langosta&quot;</span>
            <span className="text-white text-base font-medium">⚡ Lightning talks</span>
            <span className="text-white text-base font-medium">🤝 Networking</span>
          </div>

          {/* Next event card */}
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
              <p className="text-[#171717] text-sm font-bold capitalize mt-1">
                {formattedDate}
              </p>
              <p className="text-[#737373] text-sm mt-0.5">19:00 hs · Entrada libre</p>
            </div>
            <a
              href={LUMA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 w-full justify-center text-sm inline-flex items-center gap-2 bg-[#C04040] text-white px-5 py-3 rounded-full font-semibold transition-all hover:bg-[#d04848]"
            >
              Registrarse en Luma <span className="w-2 h-2 rounded-full bg-white" />
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
