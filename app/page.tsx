"use client";

import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { AboutSection } from "@/components/AboutSection";
import { ScheduleSection } from "@/components/ScheduleSection";

import { LocationSection } from "@/components/LocationSection";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Navbar />
      <main>
        <HeroSection />
        <AboutSection />
        <ScheduleSection />

        <LocationSection />
      </main>
      <Footer />
    </div>
  );
}
