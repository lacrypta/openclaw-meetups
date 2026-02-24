import { useState, useEffect } from "react";
import { useNostr } from "./hooks/useNostr";
import { useProfile } from "./hooks/useProfile";
import { useAuth } from "./hooks/useAuth";
import { Navbar } from "./components/Navbar";
import { HeroSection } from "./components/HeroSection";
import { AboutSection } from "./components/AboutSection";
import { ScheduleSection } from "./components/ScheduleSection";
import { TalksSection } from "./components/TalksSection";
import { LocationSection } from "./components/LocationSection";
import { Footer } from "./components/Footer";
import { LoginModal } from "./components/LoginModal";
import { EventBanner } from "./components/EventBanner";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { theme } from "./lib/theme";

type Route = 'home' | 'login' | 'dashboard';

function App() {
  const { pubkey, loading, error, loginNip07, loginNsec, loginBunker, logout } =
    useNostr();
  const { profile } = useProfile(pubkey);
  const [showLogin, setShowLogin] = useState(false);
  const [route, setRoute] = useState<Route>('home');
  const { isAuthenticated: isAuthChecked, logout: dashboardLogout, recheckAuth } = useAuth();

  // Simple hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash === '/dashboard') {
        if (!isAuthChecked) {
          setRoute('login');
        } else {
          setRoute('dashboard');
        }
      } else if (hash === '/login') {
        setRoute('login');
      } else {
        setRoute('home');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isAuthChecked]);

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

  const handleDashboardLoginSuccess = () => {
    recheckAuth();
    setRoute('dashboard');
    window.location.hash = '/dashboard';
  };

  const handleDashboardLogout = () => {
    dashboardLogout();
    setRoute('home');
    window.location.hash = '';
  };

  // Render different routes
  if (route === 'login') {
    return <Login onSuccess={handleDashboardLoginSuccess} />;
  }

  if (route === 'dashboard') {
    if (!isAuthChecked) {
      setRoute('login');
      return null;
    }
    return <Dashboard onLogout={handleDashboardLogout} />;
  }

  // Home/Landing page
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
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <iframe
            src='https://luma.com/embed/event/evt-aAtfxEgfRKNP3nz/simple'
            width='600'
            height='720'
            style={{
              border: "1px solid #666",
              borderRadius: "20px",
            }}
            allow='fullscreen; payment'
            aria-hidden='false'
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
            href='https://luma.com/rm5v3k5r'
            className='luma-checkout--button'
            data-luma-action='checkout'
            data-luma-event-id='evt-aAtfxEgfRKNP3nz'
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

          <script
            id='luma-checkout'
            src='https://embed.lu.ma/checkout-button.js'
          ></script>
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

export default App;
