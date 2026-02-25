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
import { theme } from "@/lib/theme";

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
    <div style={{ minHeight: "100vh", background: theme.colors.background }}>
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
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <iframe
            src="https://luma.com/embed/event/evt-aAtfxEgfRKNP3nz/simple"
            width="600"
            height="720"
            style={{
              border: "1px solid #666",
              borderRadius: "20px",
            }}
            allow="fullscreen; payment"
            aria-hidden="false"
          ></iframe>
        </div>
        <AboutSection />
        <ScheduleSection />
        <TalksSection />
        <LocationSection />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            padding: "2rem 0",
            marginBottom: "2rem",
          }}
        >
          <a
            href="https://luma.com/rm5v3k5r"
            className="luma-checkout--button"
            data-luma-action="checkout"
            data-luma-event-id="evt-aAtfxEgfRKNP3nz"
            style={{
              border: "1px solid #666",
              borderRadius: "20px",
              padding: "1rem 2rem",
              background: "#0a0f1a",
              color: "#fff",
              fontSize: "1.2rem",
              fontWeight: "bold",
            }}
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
