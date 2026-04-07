import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { createDemoSessionUser } from "../data/demoData";

const AuthContext = createContext();
const STORAGE_KEY = "docedigital_front_user";

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch (_error) {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(false);

  const persist = useCallback((nextUser) => {
    if (nextUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      return;
    }

    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const normalizedEmail = String(email || "").trim();
      const normalizedPassword = String(password || "").trim();

      if (!normalizedEmail || !normalizedPassword) {
        throw new Error("Ingresa correo y contrasena para continuar.");
      }

      setLoading(true);

      try {
        const sessionUser = createDemoSessionUser(normalizedEmail);
        setUser(sessionUser);
        persist(sessionUser);
        return sessionUser;
      } finally {
        setLoading(false);
      }
    },
    [persist]
  );

  const logout = useCallback(() => {
    setUser(null);
    persist(null);
  }, [persist]);

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      loading,
      isAuthenticated: Boolean(user),
    }),
    [loading, login, logout, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de un AuthProvider");
  return ctx;
}
