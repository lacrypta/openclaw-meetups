import { useState } from "react";
import { useNostr } from "./hooks/useNostr";
import { useProfile } from "./hooks/useProfile";
import { Navbar } from "./components/Navbar";
import { HeroSection } from "./components/HeroSection";
import { AboutSection } from "./components/AboutSection";
import { ScheduleSection } from "./components/ScheduleSection";
import { LocationSection } from "./components/LocationSection";
import { Footer } from "./components/Footer";
import { LoginModal } from "./components/LoginModal";
import { EventBanner } from "./components/EventBanner";
import { theme } from "./lib/theme";

function App() {
  const { pubkey, loading, error, loginNip07, loginNsec, loginBunker, logout } =
    useNostr();
  const { profile } = useProfile(pubkey);
  const [showLogin, setShowLogin] = useState(false);

  const handleLoginSuccess = () => {
    setShowLogin(false);
  };

  const handleNip07 = async () => {
    await loginNip07();
    handleLoginSuccess();
  };

  const handleNsec = async (nsec: string) => {
    await loginNsec(nsec);
    handleLoginSuccess();
  };

  const handleBunker = async (url: string) => {
    await loginBunker(url);
    handleLoginSuccess();
  };

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.background }}>
      <Navbar
        pubkey={pubkey}
        profile={profile}
        onLoginClick={() => setShowLogin(true)}
        onLogout={logout}
      />
      <EventBanner />
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

export default App;
