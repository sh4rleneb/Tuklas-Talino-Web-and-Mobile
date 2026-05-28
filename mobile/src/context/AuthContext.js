import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    async function boot() {
      try {
        const token = await getToken();
        if (token) {
          const data = await api('/auth/me');
          setUser(data.user);
        }
      } catch {
        await setToken(null);
      } finally {
        setBooting(false);
      }
    }
    boot();
  }, []);

  async function login(role, identifier, password) {
    const data = await api('/auth/login', { method: 'POST', body: { role, identifier, password } });
    await setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    await setToken(null);
    setUser(null);
  }

  const value = useMemo(() => ({ user, booting, login, logout }), [user, booting]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
