import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, setToken, getToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [toast, setToast] = useState('');

  useEffect(() => {
    async function boot() {
      if (!getToken()) {
        setBooting(false);
        return;
      }
      try {
        const data = await api('/auth/me');
        setUser(data.user);
      } catch {
        setToken(null);
      } finally {
        setBooting(false);
      }
    }
    boot();
  }, []);

  async function login({ role, identifier, password }) {
    const data = await api('/auth/login', { method: 'POST', body: { role, identifier, password } });
    setToken(data.token);
    setUser(data.user);
    setToast(`Maligayang pagbabalik, ${data.user.displayName}!`);
    return data.user;
  }

  function logout() {
    setToken(null);
    setUser(null);
    setToast('Naka-log out ka na.');
  }

  const value = useMemo(() => ({ user, setUser, login, logout, booting, toast, setToast }), [user, booting, toast]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
