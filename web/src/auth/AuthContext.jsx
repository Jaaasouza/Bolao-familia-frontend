import { createContext, useContext, useState, useCallback } from 'react';
import { API, getToken, setToken } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(() => !!getToken());

  const login = useCallback(async (password) => {
    const { token } = await API.login(password);
    setToken(token);
    setIsAdmin(true);
    return true;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setIsAdmin(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAdmin, login, logout }}>{children}</AuthContext.Provider>
  );
}

// Role helper for components that can't thread auth as a prop (mirrors the
// reference getAuthRole() convention).
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
