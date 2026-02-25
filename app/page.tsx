"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useNostr } from "@/hooks/useNostr";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { AboutSection } from "@/components/AboutSection";
import { ScheduleSection } from "@/components/ScheduleSection";
import { LocationSection } from "@/components/LocationSection";
import { Footer } from "@/components/Footer";
import { LoginModal } from "@/components/LoginModal";
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
    <div className="min-h-screen bg-[#f5f5f5]">
      <Navbar
        pubkey={pubkey}
        profile={profile}
        onLoginClick={() => setShowLogin(true)}
        onLogout={logout}
        dashboardHref={isAuthenticated ? "/dashboard" : undefined}
      />
      <main>
        <HeroSection />
        <AboutSection />
        <ScheduleSection />
        <LocationSection />
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
