// src/Components/AuthContext.js
import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from "react";

const AuthContext = createContext()
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => JSON.parse(localStorage.getItem("docedigital_token") || "null"));
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("docedigital_user") || "null"));
  const [loading, setLoading] = useState(false);

  const API_URL = useMemo(() => process.env.REACT_APP_API_URL || "http://localhost:5000", []);

  const persist = useCallback((newToken, newUser) => {
    if (newToken) localStorage.setItem("docedigital_token", JSON.stringify(newToken));
    else localStorage.removeItem("docedigital_token");

    if (newUser) localStorage.setItem("docedigital_user", JSON.stringify(newUser));
    else localStorage.removeItem("docedigital_user");
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    persist(null, null);
  }, [persist]);

  const fetchProfile = useCallback(
    async (authToken) => {
      try {
        const r = await fetch(`${API_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (!r.ok) throw new Error("No autorizado");
        const data = await r.json();
        if (data?.user) {
          setUser(data.user);
          persist(authToken, data.user);
        }
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    },
    [API_URL, logout, persist]
  );

  useEffect(() => {
    if (token && !user) {
      setLoading(true);
      fetchProfile(token);
    }
  }, [token, user, fetchProfile]);

  // ⬇️ LOGIN CORRECTO: usa email + password y llama /api/auth/login
  const login = useCallback(
    async (email, password) => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "No se pudo iniciar sesión");
        }

        const data = await res.json(); // { token, user }
        setToken(data.token);
        setUser(data.user);
        persist(data.token, data.user);
        return data.user;
      } finally {
        setLoading(false);
      }
    },
    [API_URL, persist]
  );

  const value = useMemo(
    () => ({
      apiBase: API_URL,
      token,
      user,
      login,
      logout,
      loading,
      isAuthenticated: Boolean(token && user),
    }),
    [API_URL, token, user, login, logout, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de un AuthProvider");
  return ctx;
}
