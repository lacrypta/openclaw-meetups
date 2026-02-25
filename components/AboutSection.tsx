"use client";

import { useTranslation } from "../i18n/useTranslation";
import { Card } from "@/components/ui/card";

export function AboutSection() {
  const { t } = useTranslation();

  return (
    <section id="about" className="py-20 bg-background">
      <div className="max-w-[1200px] mx-auto px-5 md:px-10">
        <h2 className="text-foreground text-[32px] font-extrabold text-center mb-12">
          {t.about.title}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="p-8">
            <div className="text-4xl mb-3">🦞</div>
            <h3 className="text-foreground text-xl font-bold mb-3">{t.about.openclawTitle}</h3>
            <p className="text-muted-foreground text-[15px] leading-relaxed mb-4">
              {t.about.openclawDesc}
            </p>
            <div className="flex gap-4">
              <a
                href="https://github.com/openclaw/openclaw"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-sm font-semibold"
              >
                GitHub →
              </a>
              <a
                href="https://openclaw.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-sm font-semibold"
              >
                openclaw.ai →
              </a>
            </div>
          </Card>

          <Card className="p-8">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="text-foreground text-xl font-bold mb-3">{t.about.lacryptaTitle}</h3>
            <p className="text-muted-foreground text-[15px] leading-relaxed mb-4">
              {t.about.lacryptaDesc}
            </p>
            <div className="flex gap-4">
              <a
                href="https://lacrypta.ar"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-sm font-semibold"
              >
                lacrypta.ar →
              </a>
              <a
                href="https://github.com/lacrypta"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-sm font-semibold"
              >
                GitHub →
              </a>
            </div>
          </Card>
        </div>

        <Card className="p-8 text-center">
          <h3 className="text-accent text-xl font-bold mb-3">{t.about.whyTitle}</h3>
          <p className="text-muted-foreground text-[15px] leading-relaxed max-w-[600px] mx-auto">
            {t.about.whyDesc}
          </p>
        </Card>
      </div>
    </section>
  );
}
