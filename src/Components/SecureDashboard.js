import React from "react";
import {
  FiBarChart2,
  FiCalendar,
  FiEdit3,
  FiGrid,
  FiLogOut,
  FiShare2,
  FiUsers,
} from "react-icons/fi";
import { AuthProvider, useAuth } from "./AuthContext";
import LoginForm from "./LoginForm";
import OperationsWorkspace from "./OperationsWorkspace";
import "./SecureDashboard.css";

const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: FiGrid },
  { id: "calendar", label: "Programador", icon: FiCalendar },
  { id: "create", label: "Crear Post", icon: FiEdit3 },
  { id: "audience", label: "Cuentas", icon: FiUsers },
  { id: "analytics", label: "Analiticas", icon: FiBarChart2 },
];

function DashboardBody() {
  const { isAuthenticated, user, logout, loading } = useAuth();
  const [activeView, setActiveView] = React.useState("dashboard");

  if (!isAuthenticated) {
    return (
      <div className="auth-shell">
        <section className="auth-hero">
          <div className="hero-badge">DOCE Social Suite</div>
          <h1>Explora el panel visual sin backend, sin base de datos y sin depender de servicios externos.</h1>
          <p>
            Dejamos una maqueta funcional del dashboard para que puedas conservar el front mientras reconstruyes el
            backend desde cero con calma.
          </p>

          <div className="hero-metrics">
            <article className="hero-metric-card">
              <span>Modo</span>
              <strong>Frontend standalone</strong>
            </article>
            <article className="hero-metric-card">
              <span>Datos</span>
              <strong>Demo local</strong>
            </article>
            <article className="hero-metric-card">
              <span>Siguiente paso</span>
              <strong>Nueva API</strong>
            </article>
          </div>
        </section>

        <div className="login-wrapper">
          {loading ? <div className="card login-card muted">Abriendo la experiencia demo...</div> : <LoginForm />}
        </div>
      </div>
    );
  }

  return (
    <div className="system-shell">
      <div className="dashboard-shell">
        <aside className="dashboard-sidebar">
          <div className="sidebar-brand">
            <div className="brand-mark">
              <FiShare2 />
            </div>
            <div>
              <strong>SocialHub</strong>
            </div>
          </div>

          <nav className="sidebar-nav">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`sidebar-link${activeView === item.id ? " active" : ""}`}
                  onClick={() => setActiveView(item.id)}
                >
                  <Icon />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-user">
              <div className="sidebar-avatar">{(user?.full_name || user?.name || "U").charAt(0).toUpperCase()}</div>
              <div className="sidebar-user-copy">
                <strong>{user?.full_name || user?.name || "Usuario Demo"}</strong>
                <span>{user?.email}</span>
              </div>
            </div>

            <button type="button" className="sidebar-logout" onClick={logout}>
              <FiLogOut />
              <span>Salir del demo</span>
            </button>
          </div>
        </aside>

        <main className="dashboard-main">
          <OperationsWorkspace activeView={activeView} onNavigate={setActiveView} />
        </main>
      </div>
    </div>
  );
}

function SecureDashboard() {
  return (
    <AuthProvider>
      <DashboardBody />
    </AuthProvider>
  );
}

export default SecureDashboard;
