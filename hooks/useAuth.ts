"use client";

import { useState, useEffect } from 'react';
import { login as authLogin, logout as authLogout, isAuthenticated, getPubkeyFromToken, getToken, getUserFromToken, type UserRole } from '../lib/auth';

export function useAuth() {
  const [isAuth, setIsAuth] = useState(false);
  const [ready, setReady] = useState(false);
  const [pubkey, setPubkey] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncState = () => {
    const authenticated = isAuthenticated();
    setIsAuth(authenticated);
    if (authenticated) {
      const user = getUserFromToken();
      setPubkey(user?.pubkey ?? null);
      setRole(user?.role ?? null);
      setToken(getToken());
    } else {
      setPubkey(null);
      setRole(null);
      setToken(null);
    }
  };

  useEffect(() => {
    syncState();
    setReady(true);
  }, []);

  const login = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await authLogin();
      setIsAuth(true);
      const user = getUserFromToken();
      setPubkey(user?.pubkey ?? result.pubkey);
      setRole(user?.role ?? null);
      setToken(result.token);
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
    setRole(null);
    setToken(null);
  };

  const recheckAuth = () => {
    syncState();
  };

  return {
    isAuthenticated: isAuth,
    ready,
    pubkey,
    role,
    token,
    login,
    logout,
    recheckAuth,
    loading,
    error,
  };
}
