import React, { useState } from "react";
import { useAuth } from "./AuthContext";

function LoginForm({ onSuccess }) {
  const { login, loading } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const user = await login(form.email.trim(), form.password);
      onSuccess?.(user);
    } catch (err) {
      setError(err.message || "No se pudo abrir el modo demo");
    }
  };

  return (
    <div className="card login-card">
      <h2>Entra al modo demo</h2>
      <p className="muted">
        Este proyecto ya quedo como frontend standalone. Usa cualquier correo y contrasena para recorrer la interfaz.
      </p>

      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          Email
          <input
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            placeholder="demo@docedigital.co"
            required
          />
        </label>

        <label>
          Contrasena
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            placeholder="Cualquier contrasena"
            required
          />
        </label>

        {error ? <div className="error-banner">{error}</div> : null}

        <button type="submit" className="primary" disabled={loading}>
          {loading ? "Abriendo demo..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}

export default LoginForm;
