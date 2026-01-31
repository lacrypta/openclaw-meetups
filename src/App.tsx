import { useNostr } from './hooks/useNostr';
import { useProfile } from './hooks/useProfile';
import { LoginScreen } from './components/LoginScreen';
import { ProfileView } from './components/ProfileView';

function App() {
  const { pubkey, method, loading, error, loginNip07, loginNsec, loginBunker, logout } = useNostr();
  const { profile, loading: profileLoading } = useProfile(pubkey);

  if (!pubkey) {
    return (
      <LoginScreen
        loading={loading}
        error={error}
        onNip07={loginNip07}
        onNsec={loginNsec}
        onBunker={loginBunker}
      />
    );
  }

  return (
    <ProfileView
      pubkey={pubkey}
      profile={profile}
      loading={profileLoading}
      method={method}
      onLogout={logout}
    />
  );
}

export default App;
