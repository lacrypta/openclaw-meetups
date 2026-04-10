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
  const { pubkey, loading, error, loginNip07, loginNsec, loginBunker, loginNostrConnect, logout } =
    useNostr();
  const { profile } = useProfile(pubkey);
  const [showLogin, setShowLogin] = useState(false);
  const { isAuthenticated, recheckAuth } = useAuth();
  const router = useRouter();

  const [authError, setAuthError] = useState<string | null>(null);

  const handleLoginSuccess = async () => {
    setShowLogin(false);
    setAuthError(null);
    try {
      await authLogin();
      recheckAuth();
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Dashboard auth failed after Nostr login:", err);
      setAuthError(err?.message || "Error de autenticación con el servidor");
      setShowLogin(true);
    }
  };

  const handleNip07 = async () => {
    try {
      await loginNip07();
      await handleLoginSuccess();
    } catch {
      // Error already handled in useNostr hook (displayed in UI)
    }
  };

  const handleNsec = async (nsec: string) => {
    try {
      await loginNsec(nsec);
      await handleLoginSuccess();
    } catch {
      // Error already handled in useNostr hook
    }
  };

  const handleBunker = async (url: string) => {
    try {
      await loginBunker(url);
      await handleLoginSuccess();
    } catch {
      // Error already handled in useNostr hook
    }
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
        error={authError || error}
        onNip07={handleNip07}
        onNsec={handleNsec}
        onBunker={handleBunker}
        onNostrConnect={loginNostrConnect}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
