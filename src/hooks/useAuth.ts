import { useState, useEffect } from 'react';
import { login as authLogin, logout as authLogout, isAuthenticated, getPubkeyFromToken } from '../lib/auth';

export function useAuth() {
  const [isAuth, setIsAuth] = useState(false);
  const [pubkey, setPubkey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const authenticated = isAuthenticated();
    setIsAuth(authenticated);
    if (authenticated) {
      setPubkey(getPubkeyFromToken());
    }
  }, []);

  const login = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await authLogin();
      setIsAuth(true);
      setPubkey(result.pubkey);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authLogout();
    setIsAuth(false);
    setPubkey(null);
  };

  return {
    isAuthenticated: isAuth,
    pubkey,
    login,
    logout,
    loading,
    error,
  };
}
