"use client";

import { useTranslation } from "../i18n/useTranslation";
import { Separator } from "@/components/ui/separator";
import pkg from "../package.json";
const { version } = pkg;

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-card border-t border-border pt-12 px-6 pb-6">
      <div className="flex flex-col md:flex-row gap-8 md:gap-12 max-w-[1200px] mx-auto justify-between">
        <div className="flex flex-col gap-2">
          <h4 className="text-foreground text-base font-bold mb-1">🦞 OpenClaw</h4>
          <a
            href="https://github.com/openclaw/openclaw"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground text-sm"
          >
            GitHub
          </a>
          <a
            href="https://openclaw.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground text-sm"
          >
            Website
          </a>
          <span className="text-muted-foreground/60 text-xs italic mt-1">
            EXFOLIATE! EXFOLIATE!
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="text-foreground text-base font-bold mb-1">La Crypta</h4>
          <a
            href="https://lacrypta.ar"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground text-sm"
          >
            lacrypta.ar
          </a>
          <a
            href="https://github.com/lacrypta"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground text-sm"
          >
            GitHub
          </a>
          <span className="text-muted-foreground/60 text-xs italic mt-1">
            A revolution disguised as an investment
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="text-foreground text-base font-bold mb-1">Nostr</h4>
          <a
            href="https://nostr.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground text-sm"
          >
            What is Nostr?
          </a>
          <a
            href="https://getalby.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground text-sm"
          >
            Get Alby
          </a>
        </div>
      </div>

      <Separator className="my-8" />

      <div className="text-center">
        <p className="text-muted-foreground/60 text-[13px] mb-1">
          {t.footer.builtWith} 🦞⚡ &middot; {t.footer.rights} &middot;{" "}
          {new Date().getFullYear()} &middot; v{version}
        </p>
        <p className="text-muted-foreground/60 text-[13px]">
          <a
            href="https://github.com/agustinkassis/nostr-lightning-boilerplate"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary"
          >
            {t.footer.openSource}
          </a>
        </p>
      </div>
    </footer>
  );
}
