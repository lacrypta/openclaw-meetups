"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

export function Navbar() {
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
            <SheetContent side="right" className="bg-[#f5f5f5] border-[#e5e5e5]">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="flex flex-col gap-6 pt-12">
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
                <div className="mt-8 pt-8 border-t border-[#e5e5e5]">
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
    </nav>
  );
}
