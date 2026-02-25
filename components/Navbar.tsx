"use client";

import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import type { NostrProfile } from "@/lib/nostr";

interface Props {
  pubkey: string | null;
  profile: NostrProfile | null;
  onLoginClick: () => void;
  onLogout: () => void;
  dashboardHref?: string;
}

export function Navbar({ pubkey, profile, onLoginClick, onLogout, dashboardHref }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: "#about", label: "Nosotros" },
    { href: "#experiencias", label: "Experiencias" },
    { href: "#contacto", label: "Contacto" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md z-[1000]">
      <div className="flex items-center justify-between h-full max-w-[1400px] mx-auto px-6">
        {/* Brand */}
        <a href="#" className="flex items-center gap-3">
          <img src="/openclaw-logo.png" alt="OpenClaw" className="w-6 h-6 object-contain halftone" />
          <img src="/lacrypta-logo.png" alt="La Crypta" className="w-6 h-6 object-contain" />
          <span className="text-[#171717] text-base font-medium hidden sm:inline">
            OpenClaw Meetups
          </span>
        </a>

        {/* Desktop nav links */}
        <div className="hidden md:flex gap-10">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[#737373] text-[15px] font-medium transition-colors hover:text-[#171717]"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {pubkey ? (
            <div className="hidden md:flex items-center gap-3">
              <Avatar className="w-8 h-8 border border-[#e5e5e5]">
                {profile?.picture ? (
                  <AvatarImage src={profile.picture} alt="" />
                ) : null}
                <AvatarFallback className="bg-[#e5e5e5] text-[#737373] text-xs font-bold">
                  {profile?.name?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              {dashboardHref && (
                <a
                  href={dashboardHref}
                  className="text-[#171717] text-sm font-medium hover:text-[#737373] transition-colors"
                >
                  Dashboard
                </a>
              )}
              <button
                onClick={onLogout}
                className="text-[#737373] text-sm font-medium hover:text-[#171717] transition-colors bg-transparent border-none cursor-pointer"
              >
                Salir
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="hidden md:inline-flex btn-pill !py-2 !px-5 text-sm"
            >
              Conectar <span className="dot" />
            </button>
          )}

          {/* Hamburger (mobile) */}
          <div className="md:hidden">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button className="flex flex-col gap-1.5 p-2 border-none bg-transparent cursor-pointer">
                  <span className="block w-5 h-[2px] bg-[#171717]" />
                  <span className="block w-5 h-[2px] bg-[#171717]" />
                  <span className="block w-3.5 h-[2px] bg-[#171717]" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-[#f5f5f5] border-[#e5e5e5] pt-20 z-[1001]">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <div className="flex flex-col gap-8 px-6">
                  {navLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      className="text-[#171717] text-2xl font-bold"
                      onClick={() => setMenuOpen(false)}
                    >
                      {link.label}
                    </a>
                  ))}

                  {/* Auth in mobile menu */}
                  <div className="mt-4 pt-8 border-t border-[#e5e5e5] flex flex-col gap-4">
                    {pubkey ? (
                      <>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 border border-[#e5e5e5]">
                            {profile?.picture ? (
                              <AvatarImage src={profile.picture} alt="" />
                            ) : null}
                            <AvatarFallback className="bg-[#e5e5e5] text-[#737373] text-sm font-bold">
                              {profile?.name?.[0]?.toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-[#171717] text-base font-bold">
                              {profile?.name || "Nostr User"}
                            </span>
                            <span className="text-[#737373] text-xs">
                              Conectado
                            </span>
                          </div>
                        </div>
                        {dashboardHref && (
                          <a
                            href={dashboardHref}
                            className="text-[#171717] text-base font-semibold"
                            onClick={() => setMenuOpen(false)}
                          >
                            Dashboard
                          </a>
                        )}
                        <button
                          onClick={() => { onLogout(); setMenuOpen(false); }}
                          className="text-[#737373] text-base font-medium text-left bg-transparent border-none cursor-pointer p-0"
                        >
                          Salir
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => { onLoginClick(); setMenuOpen(false); }}
                        className="btn-pill w-fit text-sm"
                      >
                        Conectar con Nostr <span className="dot" />
                      </button>
                    )}
                  </div>

                  <div className="mt-4 pt-8 border-t border-[#e5e5e5]">
                    <a
                      href="mailto:openclaw@lacrypta.ar"
                      className="text-[#171717] text-sm font-medium underline"
                    >
                      openclaw@lacrypta.ar
                    </a>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
