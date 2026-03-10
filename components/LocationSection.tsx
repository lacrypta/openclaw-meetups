"use client";

const googleMapsUrl =
  "https://www.google.com/maps/search/?api=1&query=Villanueva+1367+Buenos+Aires+Argentina";

const LUMA_URL = "https://luma.com/openclaw2";

export function LocationSection() {
  return (
    <section id="contacto" className="py-24 md:py-32 bg-[#f5f5f5]">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        {/* Section label */}
        <div className="section-label mb-8">Ubicación</div>

        {/* Heading */}
        <h2 className="text-[#171717] font-bold text-[48px] sm:text-[72px] md:text-[96px] leading-[0.95] tracking-[-0.04em] mb-16">
          Dónde<br className="hidden md:block" /> encontrarnos.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* Left - Info */}
          <div className="flex flex-col gap-8">
            <div>
              <h3 className="text-[#171717] text-2xl font-bold mb-2">La Crypta</h3>
              <p className="text-[#171717] text-lg font-semibold mb-1">Villanueva 1367</p>
              <p className="text-[#737373] text-base">Belgrano, Buenos Aires</p>
              <p className="text-[#737373] text-sm mt-2">
                A pasos de la estación Juramento (Línea D)
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <a
                href={LUMA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 bg-[#C04040] text-white px-7 py-3.5 rounded-full text-sm font-bold transition-all hover:bg-[#d04848] hover:shadow-[0_0_24px_rgba(192,64,64,0.35)] w-fit"
              >
                Reservá tu lugar ⚡
              </a>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-pill w-fit"
              >
                Abrir en Google Maps <span className="dot" />
              </a>
              <a
                href="https://lacrypta.ar"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-pill !bg-white !text-[#0a0a0a] !border !border-[#e5e5e5] w-fit"
              >
                Visitar lacrypta.ar <span className="dot !bg-[#0a0a0a]" />
              </a>
            </div>
          </div>

          {/* Right - Map image */}
          <div className="rounded-2xl overflow-hidden">
            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
              <img
                src="https://files.catbox.moe/65txy5.jpg"
                alt="Mapa La Crypta Belgrano"
                className="w-full h-[320px] object-cover block halftone hover:filter-none transition-all duration-500 cursor-pointer"
              />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
