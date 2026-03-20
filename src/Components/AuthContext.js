// src/Components/AuthContext.js
import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from "react";

// Creación del contexto de autenticación que permitirá compartir el estado de auth en toda la app
const AuthContext = createContext()

/**
 * AuthProvider: Componente proveedor que envuelve la aplicación y proporciona
 * el contexto de autenticación a todos los componentes hijos.
 * Maneja el estado del usuario, token JWT y operaciones de login/logout.
 */
export function AuthProvider({ children }) {
  // Estado del token JWT, inicializado desde localStorage si existe
  const [token, setToken] = useState(() => JSON.parse(localStorage.getItem("docedigital_token") || "null"));
  
  // Estado del usuario actual, inicializado desde localStorage si existe
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("docedigital_user") || "null"));
  
  // Estado de carga para mostrar indicadores mientras se procesan operaciones async
  const [loading, setLoading] = useState(false);

  // URL base de la API, obtenida desde variables de entorno o localhost por defecto
  const API_URL = useMemo(() => process.env.REACT_APP_API_URL || "http://localhost:5000", []);

  /**
   * persist: Función que guarda o elimina el token y usuario en localStorage
   * para mantener la sesión entre recargas de página
   */
  const persist = useCallback((newToken, newUser) => {
    if (newToken) localStorage.setItem("docedigital_token", JSON.stringify(newToken));
    else localStorage.removeItem("docedigital_token");

    if (newUser) localStorage.setItem("docedigital_user", JSON.stringify(newUser));
    else localStorage.removeItem("docedigital_user");
  }, []);

  /**
   * logout: Cierra la sesión del usuario, limpiando el estado y localStorage
   */
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    persist(null, null);
  }, [persist]);

  /**
   * fetchProfile: Obtiene el perfil del usuario desde el backend usando el token
   * Si falla (token inválido/expirado), ejecuta logout automáticamente
   */
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
        // Si hay error (token inválido), cierra sesión
        logout();
      } finally {
        setLoading(false);
      }
    },
    [API_URL, logout, persist]
  );

  /**
   * Effect que verifica si hay un token pero no usuario cargado
   * (ej: al recargar la página), y obtiene el perfil del usuario
   */
  useEffect(() => {
    if (token && !user) {
      setLoading(true);
      fetchProfile(token);
    }
  }, [token, user, fetchProfile]);

  /**
   * login: Función principal de inicio de sesión
   * Envía credenciales (email + password) al backend
   * Si es exitoso, guarda el token y datos del usuario
   * Retorna los datos del usuario o lanza error
   */
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

        const data = await res.json(); // Espera: { token, user }
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

  /**
   * value: Objeto con todos los valores y funciones que se expondrán
   * a través del contexto para ser consumidos por componentes hijos
   */
  const value = useMemo(
    () => ({
      apiBase: API_URL,           // URL base de la API
      token,                      // Token JWT actual
      user,                       // Datos del usuario autenticado
      login,                      // Función para iniciar sesión
      logout,                     // Función para cerrar sesión
      loading,                    // Estado de carga
      isAuthenticated: Boolean(token && user), // Booleano que indica si hay sesión activa
    }),
    [API_URL, token, user, login, logout, loading]
  );

  // Retorna el proveedor con el valor del contexto disponible para los hijos
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth: Hook personalizado para consumir el contexto de autenticación
 * Debe usarse dentro de componentes envueltos por AuthProvider
 * Lanza error si se usa fuera del proveedor
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de un AuthProvider");
  return ctx;
}