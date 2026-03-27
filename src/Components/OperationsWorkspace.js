import React, { useEffect, useMemo, useState } from "react";
import { FiActivity, FiClock, FiHeart, FiImage, FiLayers, FiMessageCircle, FiTrendingUp, FiUsers } from "react-icons/fi";
import { useAuth } from "./AuthContext";
import PublicationsManager from "./PublicationsManager";
import { buildLinePath, deriveDashboardData, formatDate } from "../utils/dashboardMetrics";

function DashboardHome({ publications, users }) {
  const dashboardData = useMemo(() => {
    const data = deriveDashboardData(publications, users);

    return {
      ...data,
      stats: data.stats.map((stat) => ({
        ...stat,
        icon:
          {
            blue: FiUsers,
            pink: FiHeart,
            green: FiMessageCircle,
            purple: FiTrendingUp,
          }[stat.accent] || FiActivity,
      })),
    };
  }, [publications, users]);

  return (
    <div className="workspace-stack">
      <section className="dashboard-overview">
        <header className="dashboard-summary">
          <div>
            <h2>Dashboard</h2>
            <p>Resumen de tu actividad en redes sociales</p>
          </div>
        </header>

        <section className="dashboard-stats-grid">
          {dashboardData.stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <article key={stat.label} className="dashboard-stat-card">
                <div className="dashboard-stat-copy">
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                  <small>{stat.change}</small>
                </div>
                <div className={`dashboard-stat-icon ${stat.accent}`}>
                  <Icon />
                </div>
              </article>
            );
          })}
        </section>

        <section className="dashboard-chart-grid">
          <article className="card dashboard-chart-card dashboard-line-panel">
            <h3>Engagement Semanal</h3>
            <div className="dashboard-line-chart">
              <svg viewBox="0 0 820 320" aria-label="Engagement semanal">
                {[0, 1, 2, 3].map((row) => {
                  const y = 60 + row * 50;
                  const labelValue = Math.round((dashboardData.maxValue * (4 - row)) / 4);
                  return (
                    <g key={row}>
                      <line x1="56" y1={y} x2="760" y2={y} className="chart-grid-line" />
                      <text x="12" y={y + 5} className="chart-axis-label">
                        {labelValue}
                      </text>
                    </g>
                  );
                })}
                <line x1="56" y1="260" x2="760" y2="260" className="chart-axis-line" />
                <line x1="56" y1="60" x2="56" y2="260" className="chart-axis-line" />
                {dashboardData.chartPoints.map((point) => (
                  <g key={point.label}>
                    <line x1={point.x} y1="60" x2={point.x} y2="260" className="chart-grid-line vertical" />
                    <text x={point.x} y="286" textAnchor="middle" className="chart-day-label">
                      {point.label}
                    </text>
                  </g>
                ))}
                <path d={buildLinePath(dashboardData.chartPoints)} className="chart-line-path" />
                {dashboardData.chartPoints.map((point) => (
                  <circle key={point.label} cx={point.x} cy={point.y} r="6.5" className="chart-line-point" />
                ))}
              </svg>
            </div>
          </article>

          <article className="card dashboard-chart-card dashboard-donut-panel">
            <h3>Distribucion por Plataforma</h3>
            <div className="dashboard-donut-wrap">
              <svg viewBox="0 0 220 220" className="dashboard-donut-chart" aria-label="Distribucion por plataforma">
                <circle cx="110" cy="110" r="70" className="donut-track" />
                {dashboardData.donutSegments.map((segment) => (
                  <circle
                    key={segment.name}
                    cx="110"
                    cy="110"
                    r="70"
                    className="donut-segment"
                    style={{
                      stroke: segment.color,
                      strokeDasharray: `${segment.segmentLength} ${segment.circumference}`,
                      strokeDashoffset: segment.offset,
                    }}
                  />
                ))}
              </svg>

              <div className="dashboard-platform-legend">
                {dashboardData.platformData.map((platform) => (
                  <div key={platform.name} className="platform-legend-item">
                    <div className="platform-legend-name">
                      <span className="platform-legend-dot" style={{ backgroundColor: platform.color }} />
                      <span>{platform.name}</span>
                    </div>
                    <strong>{platform.value}%</strong>
                  </div>
                ))}
              </div>
            </div>
          </article>
        </section>
      </section>

      <PublicationsManager />
    </div>
  );
}

function SchedulerModule({ publications }) {
  const scheduledPublications = publications
    .filter((publication) => String(publication.created_at || "").length)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <section className="card module-card">
      <header className="module-header">
        <div>
          <p className="eyebrow">Programador</p>
          <h2>Pipeline editorial</h2>
          <p className="muted">Ordena el contenido por fecha para revisar lo que sale primero.</p>
        </div>
      </header>

      <div className="timeline">
        {scheduledPublications.map((publication) => (
          <article key={publication.publication_id} className="timeline-item">
            <div className="timeline-dot" />
            <div className="timeline-card">
              <div className="timeline-top">
                <strong>Publicacion #{publication.publication_id}</strong>
                <span>{formatDate(publication.created_at)}</span>
              </div>
              <p>{publication.content}</p>
              <div className="timeline-metrics">
                <span>{publication.total_likes} likes</span>
                <span>{publication.total_comments} comentarios</span>
                <span>{publication.total_shares} compartidos</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function CreateModule() {
  return (
    <section className="card module-card">
      <header className="module-header">
        <div>
          <p className="eyebrow">Crear contenido</p>
          <h2>Editor operativo</h2>
          <p className="muted">Usa el modulo principal para crear, editar o exportar publicaciones.</p>
        </div>
      </header>

      <div className="feature-grid">
        <article className="feature-card">
          <FiLayers />
          <strong>CRUD completo</strong>
          <p>Desde el dashboard principal puedes abrir el formulario, editar registros y eliminarlos.</p>
        </article>
        <article className="feature-card">
          <FiImage />
          <strong>Imagenes externas</strong>
          <p>Soporta URLs de imagen para enriquecer el contenido y validar la vista previa desde la tabla.</p>
        </article>
        <article className="feature-card">
          <FiActivity />
          <strong>Exportacion</strong>
          <p>Los datos filtrados pueden exportarse a Excel sin salir del flujo operativo.</p>
        </article>
      </div>
    </section>
  );
}

function AudienceModule({ users }) {
  return (
    <section className="card module-card">
      <header className="module-header">
        <div>
          <p className="eyebrow">Audiencia interna</p>
          <h2>Usuarios activos del sistema</h2>
          <p className="muted">Lista real de usuarios disponibles en la base de datos de desarrollo.</p>
        </div>
      </header>

      <div className="audience-grid">
        {users.map((user) => (
          <article key={user.id} className="audience-card">
            <div className="audience-avatar">{(user.full_name || user.email || "U").charAt(0).toUpperCase()}</div>
            <strong>{user.full_name}</strong>
            <span>{user.email}</span>
            <small>{user.status === "active" ? "Activo" : "Inactivo"}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function AnalyticsModule({ publications }) {
  const topPublications = [...publications]
    .sort((a, b) => (b.total_likes + b.total_comments + b.total_shares) - (a.total_likes + a.total_comments + a.total_shares))
    .slice(0, 6);

  const totals = publications.reduce(
    (acc, publication) => {
      acc.likes += Number(publication.total_likes || 0);
      acc.comments += Number(publication.total_comments || 0);
      acc.shares += Number(publication.total_shares || 0);
      return acc;
    },
    { likes: 0, comments: 0, shares: 0 }
  );

  return (
    <section className="card module-card">
      <header className="module-header">
        <div>
          <p className="eyebrow">Analiticas</p>
          <h2>Rendimiento del contenido</h2>
        </div>
      </header>

      <div className="feature-grid analytics-grid">
        <article className="feature-card">
          <FiActivity />
          <strong>{totals.likes}</strong>
          <p>Likes totales acumulados en todas las publicaciones.</p>
        </article>
        <article className="feature-card">
          <FiClock />
          <strong>{totals.comments}</strong>
          <p>Comentarios registrados para medir conversacion.</p>
        </article>
        <article className="feature-card">
          <FiUsers />
          <strong>{totals.shares}</strong>
          <p>Compartidos totales como señal de distribucion organica.</p>
        </article>
      </div>

      <div className="module-list">
        {topPublications.map((publication) => (
          <article key={publication.publication_id} className="module-list-item">
            <div>
              <strong>#{publication.publication_id}</strong>
              <p>{publication.content}</p>
            </div>
            <span>{publication.total_likes + publication.total_comments + publication.total_shares} interacciones</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function SettingsModule({ user }) {
  return (
    <section className="card module-card">
      <header className="module-header">
        <div>
          <p className="eyebrow">Configuracion</p>
          <h2>Estado del entorno</h2>
          <p className="muted">Resumen rapido del usuario autenticado y del flujo tecnico que ya montamos.</p>
        </div>
      </header>

      <div className="settings-grid">
        <article className="settings-card">
          <strong>Usuario activo</strong>
          <span>{user?.full_name || user?.name}</span>
        </article>
        <article className="settings-card">
          <strong>Email</strong>
          <span>{user?.email}</span>
        </article>
        <article className="settings-card">
          <strong>Autenticacion</strong>
          <span>JWT operativo</span>
        </article>
        <article className="settings-card">
          <strong>Base de datos</strong>
          <span>MySQL con seed cargado</span>
        </article>
      </div>
    </section>
  );
}

export default function OperationsWorkspace({ activeView }) {
  const { apiBase, token, user, logout } = useAuth();
  const [publications, setPublications] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!token) return;

    let mounted = true;

    const load = async () => {
      try {
        const [publicationsResponse, usersResponse] = await Promise.all([
          fetch(`${apiBase}/api/publications`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${apiBase}/api/users`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (publicationsResponse.status === 401 || usersResponse.status === 401) {
          logout();
          return;
        }

        const publicationsData = await publicationsResponse.json();
        const usersData = await usersResponse.json();

        if (!mounted) return;

        setPublications(Array.isArray(publicationsData) ? publicationsData : []);
        setUsers(Array.isArray(usersData) ? usersData : []);
      } catch (_error) {
        if (mounted) {
          setPublications([]);
          setUsers([]);
        }
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [apiBase, logout, token]);

  const view = useMemo(() => {
    switch (activeView) {
      case "calendar":
        return <SchedulerModule publications={publications} />;
      case "create":
        return <CreateModule />;
      case "audience":
        return <AudienceModule users={users} />;
      case "analytics":
        return <AnalyticsModule publications={publications} />;
      case "settings":
        return <SettingsModule user={user} />;
      case "dashboard":
      default:
        return <DashboardHome publications={publications} users={users} />;
    }
  }, [activeView, publications, user, users]);

  return view;
}
