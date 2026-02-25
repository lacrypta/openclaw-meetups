"use client";

import { useState, useEffect } from 'react';
import { login as authLogin, logout as authLogout, isAuthenticated, getPubkeyFromToken } from '../lib/auth';

export function useAuth() {
  const [isAuth, setIsAuth] = useState(false);
  const [ready, setReady] = useState(false);
  const [pubkey, setPubkey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const authenticated = isAuthenticated();
    setIsAuth(authenticated);
    if (authenticated) {
      setPubkey(getPubkeyFromToken());
    }
    setReady(true);
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

  const recheckAuth = () => {
    const authenticated = isAuthenticated();
    setIsAuth(authenticated);
    if (authenticated) {
      setPubkey(getPubkeyFromToken());
    }
  };

  return {
    isAuthenticated: isAuth,
    ready,
    pubkey,
    login,
    logout,
    recheckAuth,
    loading,
    error,
  };
}
