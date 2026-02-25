"use client";

import { useTranslation } from "../i18n/useTranslation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function LocationSection() {
  const { t, lang } = useTranslation();
  const googleMapsUrl = "https://www.google.com/maps/search/?api=1&query=Villanueva+1367+Buenos+Aires+Argentina";

  return (
    <section id="location" className="py-20 bg-background">
      <div className="max-w-[1200px] mx-auto px-5 md:px-10">
        <h2 className="text-foreground text-[32px] font-extrabold text-center mb-12">
          {t.location.title}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <Card className="p-8 flex flex-col gap-2">
            <div className="text-4xl mb-2">⚡</div>
            <h3 className="text-foreground text-2xl font-extrabold">{t.location.name}</h3>
            <p className="text-primary text-lg font-bold my-2">📍 Villanueva 1367</p>
            <p className="text-muted-foreground text-[15px]">
              {t.location.neighborhood}, {t.location.city}
            </p>
            <p className="text-muted-foreground/60 text-sm my-2 leading-relaxed">
              {lang === "es"
                ? "Barrio Belgrano, a pasos de la estación Juramento (Línea D)"
                : "Belgrano neighborhood, steps from Juramento station (Line D)"}
            </p>
            <div className="flex flex-col gap-3 mt-4">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-5 py-3 bg-[#4285f4] rounded-lg text-white text-sm font-semibold text-center"
              >
                🗺️ {lang === "es" ? "Abrir en Google Maps" : "Open in Google Maps"}
              </a>
              <a
                href="https://lacrypta.ar"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-5 py-2.5 border border-primary rounded-lg text-primary text-sm font-semibold text-center"
              >
                {t.location.visitWebsite} →
              </a>
            </div>
          </Card>

          <Card className="p-0 overflow-hidden">
            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
              <img
                src="https://files.catbox.moe/65txy5.jpg"
                alt="Mapa La Crypta Belgrano"
                className="w-full h-[300px] object-cover block cursor-pointer"
              />
            </a>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-3 bg-card text-primary text-[13px] font-semibold text-center"
            >
              {lang === "es" ? "Ver en Google Maps" : "View on Google Maps"} →
            </a>
          </Card>
        </div>
      </div>
    </section>
  );
}
