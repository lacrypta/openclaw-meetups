"use client";

import { useState } from "react";
import { useTranslation } from "../i18n/useTranslation";
import { Button } from "@/components/ui/button";

const LUMA_URL = "https://luma.com/rm5v3k5r";

export function EventBanner() {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="fixed top-16 left-0 right-0 bg-gradient-to-r from-primary to-accent z-[999] px-6 py-2.5">
      <div className="relative flex items-center justify-center gap-3 max-w-[1200px] mx-auto flex-wrap">
        <span className="text-lg">🦞🇦🇷</span>
        <span className="text-foreground text-sm font-bold">{t.banner.text}</span>
        <a
          href={LUMA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground text-[13px] font-bold no-underline bg-white/20 px-3.5 py-1 rounded-full border border-white/30"
        >
          {t.banner.cta} →
        </a>
        <button
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-transparent border-none text-white/70 text-sm cursor-pointer p-1"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
