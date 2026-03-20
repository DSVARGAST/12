import React from "react";
import { FiBarChart2, FiCalendar, FiEdit3, FiGrid, FiLogOut, FiSettings, FiShare2, FiUsers } from "react-icons/fi";
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
  { id: "settings", label: "Configuracion", icon: FiSettings },
];

function DashboardBody() {
  const { isAuthenticated, user, logout, loading } = useAuth();
  const [activeView, setActiveView] = React.useState("dashboard");

  if (!isAuthenticated) {
    return (
      <div className="auth-shell">
        <section className="auth-hero">
          <div className="hero-badge">DOCE Social Suite</div>
          <h1>Gestiona publicaciones, rendimiento y operaciones desde un panel mas serio.</h1>
          <p>
            El backend ya esta conectado. Ahora la experiencia visual se organiza como una herramienta
            de gestion de redes, no como una pagina suelta.
          </p>

          <div className="hero-metrics">
            <article className="hero-metric-card">
              <span>Automatizacion</span>
              <strong>Activa</strong>
            </article>
            <article className="hero-metric-card">
              <span>Publicaciones</span>
              <strong>CRUD + Excel</strong>
            </article>
            <article className="hero-metric-card">
              <span>Seguridad</span>
              <strong>JWT + MySQL</strong>
            </article>
          </div>
        </section>

        <div className="login-wrapper">
          {loading ? <div className="card login-card muted">Validando sesion...</div> : <LoginForm />}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">
            <FiShare2 />
          </div>
          <div>
            <strong>DOCE Social</strong>
            <span>Management System</span>
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

        <div className="sidebar-user">
          <div className="sidebar-avatar">{(user?.full_name || user?.name || "U").charAt(0).toUpperCase()}</div>
          <div className="sidebar-user-copy">
            <strong>{user?.full_name || user?.name || "Usuario"}</strong>
            <span>{user?.email}</span>
          </div>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <p className="eyebrow">Centro de control</p>
            <h1>{navigationItems.find((item) => item.id === activeView)?.label || "Panel"}</h1>
            <p className="muted">Administra contenido, revisa rendimiento y ejecuta acciones operativas.</p>
          </div>

          <div className="user-pill">
            <div>
              <span className="user-name">{user?.full_name || user?.name || "Usuario"}</span>
              <span className="user-role">{user?.role_name || "Administrador"}</span>
            </div>
            <button type="button" className="ghost" onClick={logout}>
              <FiLogOut />
              <span>Cerrar sesion</span>
            </button>
          </div>
        </header>

        <OperationsWorkspace activeView={activeView} />
      </main>
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
