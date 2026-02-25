"use client";

import { useState } from "react";
import { useTranslation } from "../i18n/useTranslation";
import type { Language } from "../i18n/context";
import type { NostrProfile } from "../lib/nostr";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface Props {
  pubkey: string | null;
  profile: NostrProfile | null;
  onLoginClick: () => void;
  onLogout: () => void;
  dashboardHref?: string;
}

export function Navbar({ pubkey, profile, onLoginClick, onLogout, dashboardHref }: Props) {
  const { t, lang, setLang } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: "#about", label: t.nav.about },
    { href: "#schedule", label: t.nav.schedule },
    { href: "#location", label: t.nav.location },
  ];

  const toggleLang = (l: Language) => {
    setLang(l);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-md border-b border-border z-[1000]">
      <div className="flex items-center justify-between h-full max-w-[1200px] mx-auto px-6">
        {/* Brand */}
        <a href="#" className="flex items-center gap-2">
          <img src="/openclaw-logo.png" alt="OpenClaw" className="w-6 h-6 object-contain" />
          <span className="text-base font-semibold text-accent">OpenClaw</span>
          <span className="text-muted-foreground/60 text-sm">x</span>
          <img src="/lacrypta-logo.png" alt="La Crypta" className="w-6 h-6 object-contain" />
          <span className="text-lg font-bold text-foreground hidden sm:inline">La Crypta</span>
        </a>

        {/* Desktop nav links */}
        <div className="hidden md:flex gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-muted-foreground text-sm font-medium transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Language switch */}
          <div className="flex gap-0.5 bg-border rounded-md p-0.5">
            <button
              className={cn(
                "px-2.5 py-1 border-none rounded text-xs font-semibold cursor-pointer transition-all",
                lang === "es"
                  ? "bg-accent text-foreground"
                  : "bg-transparent text-muted-foreground"
              )}
              onClick={() => toggleLang("es")}
            >
              ES
            </button>
            <button
              className={cn(
                "px-2.5 py-1 border-none rounded text-xs font-semibold cursor-pointer transition-all",
                lang === "en"
                  ? "bg-accent text-foreground"
                  : "bg-transparent text-muted-foreground"
              )}
              onClick={() => toggleLang("en")}
            >
              EN
            </button>
          </div>

          {pubkey ? (
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                {profile?.picture ? (
                  <AvatarImage src={profile.picture} alt="" />
                ) : null}
                <AvatarFallback className="text-base">👤</AvatarFallback>
              </Avatar>
              {dashboardHref && (
                <a href={dashboardHref}>
                  <Button size="sm" variant="default" className="text-xs">
                    Dashboard
                  </Button>
                </a>
              )}
              <Button size="sm" variant="outline" className="text-xs" onClick={onLogout}>
                {t.nav.logout}
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={onLoginClick}>
              {t.nav.login}
            </Button>
          )}

          {/* Mobile menu */}
          <div className="md:hidden">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button className="p-1 border-none bg-transparent text-foreground text-xl cursor-pointer">
                  ☰
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-background border-border">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <div className="flex flex-col gap-4 pt-8">
                  {navLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      className="text-muted-foreground text-base font-medium py-2"
                      onClick={() => setMenuOpen(false)}
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
