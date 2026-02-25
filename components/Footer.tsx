"use client";

import pkg from "../package.json";
const { version } = pkg;

export function Footer() {
  return (
    <footer className="bg-[#f5f5f5] pt-20 pb-10 px-6">
      {/* Cross markers */}
      <div className="cross-markers max-w-[1400px] mx-auto mb-16">
        <span>+</span><span>+</span><span>+</span><span>+</span><span>+</span>
      </div>

      <div className="max-w-[1400px] mx-auto">
        {/* Three column footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          {/* Email */}
          <div>
            <a
              href="mailto:openclaw@lacrypta.ar"
              className="text-[#171717] text-base font-bold underline underline-offset-4"
            >
              openclaw@lacrypta.ar
            </a>
          </div>

          {/* Navigation */}
          <div className="flex flex-col gap-3">
            <a href="#" className="text-[#171717] text-sm font-medium hover:text-[#737373] transition-colors">
              Inicio
            </a>
            <a href="#about" className="text-[#171717] text-sm font-medium hover:text-[#737373] transition-colors">
              Nosotros
            </a>
            <a href="#experiencias" className="text-[#171717] text-sm font-medium hover:text-[#737373] transition-colors">
              Experiencias
            </a>
            <a href="#contacto" className="text-[#171717] text-sm font-medium hover:text-[#737373] transition-colors">
              Contacto
            </a>
          </div>

          {/* Social */}
          <div className="flex flex-col gap-3">
            <a
              href="https://github.com/lacrypta/openclaw-meetups"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#171717] text-sm font-medium hover:text-[#737373] transition-colors"
            >
              GitHub &#8599;
            </a>
            <a
              href="https://github.com/openclaw/openclaw"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#171717] text-sm font-medium hover:text-[#737373] transition-colors"
            >
              OpenClaw &#8599;
            </a>
            <a
              href="https://lacrypta.ar"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#171717] text-sm font-medium hover:text-[#737373] transition-colors"
            >
              La Crypta &#8599;
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-[#e5e5e5] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="text-[#737373] text-[13px]">
            &copy; {new Date().getFullYear()} La Crypta &middot; OpenClaw Meetups &middot; v{version}
          </p>
          <p className="text-[#737373] text-[13px]">
            Open-source &middot; Construido con Nostr
          </p>
        </div>

        {/* Giant watermark */}
        <div className="mt-12 overflow-hidden">
          <p className="text-[#e5e5e5] font-bold text-[48px] sm:text-[72px] md:text-[120px] leading-none tracking-[-0.04em] text-right whitespace-nowrap select-none">
            OpenClaw Meetups
          </p>
        </div>
      </div>
    </footer>
  );
}
