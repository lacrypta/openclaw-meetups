"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useNostr } from "@/hooks/useNostr";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { AboutSection } from "@/components/AboutSection";
import { ScheduleSection } from "@/components/ScheduleSection";
import { TalksSection } from "@/components/TalksSection";
import { LocationSection } from "@/components/LocationSection";
import { Footer } from "@/components/Footer";
import { LoginModal } from "@/components/LoginModal";
import { EventBanner } from "@/components/EventBanner";
import { login as authLogin } from "@/lib/auth";

export default function HomePage() {
  const { pubkey, loading, error, loginNip07, loginNsec, loginBunker, logout } =
    useNostr();
  const { profile } = useProfile(pubkey);
  const [showLogin, setShowLogin] = useState(false);
  const { isAuthenticated, recheckAuth } = useAuth();
  const router = useRouter();

  const handleLoginSuccess = async () => {
    setShowLogin(false);
    try {
      await authLogin();
      recheckAuth();
      router.push("/dashboard");
    } catch (err) {
      console.error("Dashboard auth failed after Nostr login:", err);
    }
  };

  const handleNip07 = async () => {
    await loginNip07();
    await handleLoginSuccess();
  };

  const handleNsec = async (nsec: string) => {
    await loginNsec(nsec);
    await handleLoginSuccess();
  };

  const handleBunker = async (url: string) => {
    await loginBunker(url);
    await handleLoginSuccess();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        pubkey={pubkey}
        profile={profile}
        onLoginClick={() => setShowLogin(true)}
        onLogout={logout}
        dashboardHref={isAuthenticated ? "/dashboard" : undefined}
      />
      <EventBanner />
      <main>
        <HeroSection />
        <div className="flex justify-center items-center">
          <iframe
            src="https://luma.com/embed/event/evt-aAtfxEgfRKNP3nz/simple"
            width="600"
            height="720"
            className="border border-border/50 rounded-2xl"
            allow="fullscreen; payment"
            aria-hidden="false"
          ></iframe>
        </div>
        <AboutSection />
        <ScheduleSection />
        <TalksSection />
        <LocationSection />
        <div className="flex justify-center items-center w-full py-8 mb-8">
          <a
            href="https://luma.com/rm5v3k5r"
            className="luma-checkout--button border border-border/50 rounded-2xl px-8 py-4 bg-background text-foreground text-xl font-bold"
            data-luma-action="checkout"
            data-luma-event-id="evt-aAtfxEgfRKNP3nz"
          >
            Inscribirse al evento
          </a>
          <Script
            id="luma-checkout"
            src="https://embed.lu.ma/checkout-button.js"
            strategy="lazyOnload"
          />
        </div>
      </main>
      <Footer />
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        loading={loading}
        error={error}
        onNip07={handleNip07}
        onNsec={handleNsec}
        onBunker={handleBunker}
      />
    </div>
  );
}
