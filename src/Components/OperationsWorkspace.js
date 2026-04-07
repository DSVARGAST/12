import React, { useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiArrowLeft,
  FiCalendar,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiEdit2,
  FiEye,
  FiExternalLink,
  FiFacebook,
  FiGrid,
  FiHash,
  FiHeart,
  FiImage,
  FiInstagram,
  FiLinkedin,
  FiMessageCircle,
  FiMapPin,
  FiPlus,
  FiSend,
  FiSettings,
  FiShare2,
  FiSmile,
  FiTrendingUp,
  FiTrash2,
  FiTwitter,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import { useAuth } from "./AuthContext";
import { getDemoPublications, getDemoUsers } from "../data/demoData";
import { buildLinePath, deriveDashboardData } from "../utils/dashboardMetrics";

const platformSequence = [
  { name: "Instagram", icon: FiInstagram, color: "#e72f6f" },
  { name: "Twitter", icon: FiTwitter, color: "#2d9bf0" },
  { name: "Facebook", icon: FiFacebook, color: "#4a6fb9" },
  { name: "LinkedIn", icon: FiLinkedin, color: "#0b76b7" },
];

const recentPostFallbacks = [
  "Lanzamiento de nueva campana de verano con foco en alcance y conversion.",
  "Tips para mejorar tu estrategia de contenido con una agenda editorial mas constante.",
  "Evento especial este fin de semana con mensajes coordinados para todos los canales.",
  "Casos de exito en marketing digital con aprendizajes utiles para nuevos clientes.",
];

const schedulerTemplates = [
  {
    scheduledAt: "2026-03-20T10:00:00",
    platform: platformSequence[0],
    fallback: "Nueva coleccion primavera-verano 2026",
  },
  {
    scheduledAt: "2026-03-20T14:30:00",
    platform: platformSequence[1],
    fallback: "Consejos para aumentar tu engagement en redes sociales",
  },
  {
    scheduledAt: "2026-03-21T09:00:00",
    platform: platformSequence[2],
    fallback: "Evento en vivo este fin de semana",
  },
  {
    scheduledAt: "2026-03-21T16:00:00",
    platform: platformSequence[3],
    fallback: "El futuro del marketing digital en 2026",
  },
  {
    scheduledAt: "2026-03-22T11:00:00",
    platform: platformSequence[0],
    fallback: "Behind the scenes de nuestra ultima campana",
  },
];

function resolvePublicationPlatform(publication, index = 0) {
  const rawPlatform =
    publication?.platform?.name ||
    publication?.platform_name ||
    publication?.social_network ||
    publication?.network ||
    publication?.platform;

  if (typeof rawPlatform === "string") {
    const match = platformSequence.find((platform) => platform.name.toLowerCase() === rawPlatform.toLowerCase());
    if (match) return match;
  }

  return platformSequence[index % platformSequence.length];
}

function hasCorruptedText(value) {
  const text = String(value || "");
  if (!text.trim()) return true;

  const invalidChars = Array.from(text).filter((char) => {
    const code = char.charCodeAt(0);
    return char === "�" || code < 32;
  }).length;
  return invalidChars > 2 || invalidChars / text.length > 0.08;
}

function getReadableContent(value, fallback) {
  return hasCorruptedText(value) ? fallback : String(value || fallback || "");
}

function getDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMonthLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("es-CO", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatLongDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatTimeLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";

  return new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function buildCalendarDays(currentMonthDate, markedDateKeys) {
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 35 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    const key = getDateKey(day);

    return {
      key,
      date: day,
      dayNumber: day.getDate(),
      isCurrentMonth: day.getMonth() === month,
      isMarked: markedDateKeys.has(key),
    };
  });
}

function formatRelativeTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Hace poco";
  }

  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));

  if (diffHours < 24) {
    return `Hace ${diffHours} hora${diffHours === 1 ? "" : "s"}`;
  }

  const diffDays = Math.max(1, Math.round(diffHours / 24));
  return `Hace ${diffDays} dia${diffDays === 1 ? "" : "s"}`;
}

function buildSvgPoints(labels, values, options = {}) {
  const {
    width = 760,
    height = 320,
    left = 56,
    right = 28,
    top = 40,
    bottom = 36,
    maxValue,
  } = options;

  const resolvedMax = maxValue || Math.max(...values, 1);
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const stepCount = Math.max(labels.length - 1, 1);

  return labels.map((label, index) => {
    const value = Number(values[index] || 0);
    const ratio = labels.length === 1 ? 0.5 : index / stepCount;

    return {
      label,
      value,
      x: left + chartWidth * ratio,
      y: top + chartHeight - (value / resolvedMax) * chartHeight,
    };
  });
}

function buildAreaPath(points, baselineY) {
  if (!points.length) return "";

  return `${buildLinePath(points)} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`;
}

function buildRadarPolygon(values, options = {}) {
  const { centerX = 180, centerY = 150, radius = 100, maxValue = 100 } = options;

  return values.map((value, index) => {
    const angle = ((-90 + (360 / values.length) * index) * Math.PI) / 180;
    const distance = (Number(value || 0) / maxValue) * radius;

    return {
      value,
      x: centerX + Math.cos(angle) * distance,
      y: centerY + Math.sin(angle) * distance,
    };
  });
}

function formatCompactMetric(value) {
  const numericValue = Math.round(Number(value || 0));

  if (numericValue >= 1000000) {
    return `${(numericValue / 1000000).toFixed(1)}M`;
  }

  if (numericValue >= 1000) {
    const compactValue = numericValue >= 100000 ? (numericValue / 1000).toFixed(0) : (numericValue / 1000).toFixed(1);
    return `${compactValue}K`;
  }

  return String(numericValue);
}

function formatAnalyticsDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function buildPublicationDetail(publication) {
  const likes = Number(publication.total_likes || 0);
  const comments = Number(publication.total_comments || 0);
  const shares = Number(publication.total_shares || 0);
  const reach = likes * 8 + comments * 26 + shares * 42 + 9200;
  const impressions = reach + likes * 4 + comments * 8;
  const saves = Math.max(48, Math.round(likes * 0.12 + comments * 0.25));
  const totalInteractions = likes + comments + shares;
  const engagementRate = ((totalInteractions / Math.max(reach, 1)) * 100).toFixed(2);
  const clickRate = (Math.max(1.1, comments / Math.max(likes, 1) + 2.4)).toFixed(1);
  const averageTime = `1m ${30 + Math.min(29, comments)}s`;
  const shareRate = `${Math.max(0.2, (shares / Math.max(reach, 1)) * 100).toFixed(1)}%`;
  const hourLabels = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "24:00"];
  const hourValues = [
    Math.round(totalInteractions * 0.05),
    Math.round(totalInteractions * 0.12),
    Math.round(totalInteractions * 0.34),
    Math.round(totalInteractions * 0.56),
    Math.round(totalInteractions * 0.74),
    Math.round(totalInteractions * 0.91),
    totalInteractions,
  ];

  return {
    reach,
    impressions,
    saves,
    totalInteractions,
    engagementRate,
    clickRate,
    averageTime,
    shareRate,
    hourLabels,
    hourValues,
    ageDistribution: [
      { label: "18-24", value: 26 },
      { label: "25-34", value: 45 },
      { label: "35-44", value: 20 },
      { label: "45+", value: 10 },
    ],
    genderDistribution: [
      { label: "Mujeres", value: 62, color: "#ec4899" },
      { label: "Hombres", value: 35, color: "#3b82f6" },
      { label: "Otros", value: 3, color: "#8b5cf6" },
    ],
    locations: [
      { label: "Ciudad de Mexico", percentage: 35, audience: 4375 },
      { label: "Guadalajara", percentage: 22, audience: 2750 },
      { label: "Monterrey", percentage: 18, audience: 2250 },
      { label: "Puebla", percentage: 12, audience: 1500 },
      { label: "Otros", percentage: 13, audience: 1625 },
    ],
    comments: [
      { name: "Maria Gonzalez", initial: "M", time: "Hace 1 hora", text: "Me encanta. Definitivamente ire.", likes: 45 },
      { name: "Carlos Rodriguez", initial: "C", time: "Hace 2 horas", text: "Excelente iniciativa, muy profesional.", likes: 32 },
      { name: "Ana Martinez", initial: "A", time: "Hace 3 horas", text: "Habra descuentos especiales?", likes: 28 },
      { name: "Luis Hernandez", initial: "L", time: "Hace 4 horas", text: "Compartire con mis amigos.", likes: 19 },
    ],
  };
}

function DashboardHome({ publications, users, onOpenPost }) {
  const [selectedPlatform, setSelectedPlatform] = useState("Todas");

  const decoratedPublications = useMemo(
    () =>
      publications.map((publication, index) => ({
        ...publication,
        platform: resolvePublicationPlatform(publication, index),
        content: getReadableContent(publication.content, recentPostFallbacks[index % recentPostFallbacks.length]),
      })),
    [publications]
  );

  const filteredPublications = useMemo(
    () =>
      selectedPlatform === "Todas"
        ? decoratedPublications
        : decoratedPublications.filter((publication) => publication.platform.name === selectedPlatform),
    [decoratedPublications, selectedPlatform]
  );

  const scopedUsers = useMemo(
    () =>
      selectedPlatform === "Todas"
        ? users
        : users.slice(0, Math.max(1, Math.ceil(Math.max(users.length, 1) / platformSequence.length))),
    [selectedPlatform, users]
  );

  const dashboardData = useMemo(() => {
    const data = deriveDashboardData(
      filteredPublications.map((publication) => ({
        ...publication,
        platform: publication.platform.name,
      })),
      scopedUsers
    );

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
  }, [filteredPublications, scopedUsers]);

  const recentPosts = useMemo(
    () =>
      [...filteredPublications]
        .filter((publication) => publication.content)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 4)
        .map((publication) => publication),
    [filteredPublications]
  );

  return (
    <div className="workspace-stack">
      <section className="dashboard-overview">
        <header className="dashboard-summary">
          <div>
            <h2>Dashboard</h2>
            <p>Resumen de tu actividad en redes sociales</p>
          </div>
        </header>

        <div className="dashboard-filter-row">
          {[
            { label: "Todas", icon: FiGrid },
            ...platformSequence.map((platform) => ({
              label: platform.name,
              icon: platform.icon,
            })),
          ].map((item) => {
            const Icon = item.icon;
            const active = selectedPlatform === item.label;

            return (
              <button
                key={item.label}
                type="button"
                className={`dashboard-filter-chip${active ? " active" : ""}`}
                onClick={() => setSelectedPlatform(item.label)}
              >
                <Icon />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

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
            <h3>Distribucion por plataforma</h3>
            <div className="dashboard-donut-wrap compact">
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

        <article className="card dashboard-recent-card">
          <h3>Posts Recientes</h3>

          <div className="recent-post-list">
            {recentPosts.length ? recentPosts.map((publication) => {
              const PlatformIcon = publication.platform.icon;

              return (
                <button
                  key={publication.publication_id}
                  type="button"
                  className="recent-post-item recent-post-button"
                  onClick={() => onOpenPost(publication)}
                >
                  <div className="recent-post-platform">
                    <div
                      className="recent-post-icon"
                      style={{ color: publication.platform.color }}
                    >
                      <PlatformIcon />
                    </div>
                  </div>

                  <div className="recent-post-body">
                    <div className="recent-post-meta">
                      <strong>{publication.platform.name}</strong>
                      <span>{formatRelativeTime(publication.created_at)}</span>
                    </div>

                    <p>{publication.content}</p>

                    <div className="recent-post-stats">
                      <span>
                        <FiHeart />
                        {publication.total_likes}
                      </span>
                      <span>
                        <FiMessageCircle />
                        {publication.total_comments}
                      </span>
                    </div>
                  </div>
                </button>
              );
            }) : (
              <div className="dashboard-empty-state">
                <strong>No hay publicaciones para este filtro.</strong>
                <span>Cambia de red social o vuelve a "Todas" para ver mas actividad.</span>
              </div>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

function PublicationDetailView({ publication, onBack }) {
  const PlatformIcon = publication.platform.icon;
  const detail = useMemo(() => buildPublicationDetail(publication), [publication]);
  const contentParagraphs = useMemo(
    () =>
      String(publication.content || "")
        .split(/\n+/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean),
    [publication.content]
  );

  const engagementPoints = useMemo(
    () =>
      buildSvgPoints(detail.hourLabels, detail.hourValues, {
        width: 820,
        height: 320,
        left: 60,
        right: 24,
        top: 28,
        bottom: 44,
        maxValue: Math.max(...detail.hourValues, 1) + 120,
      }),
    [detail.hourLabels, detail.hourValues]
  );

  const engagementAreaPath = useMemo(() => buildAreaPath(engagementPoints, 276), [engagementPoints]);
  const engagementLinePath = useMemo(() => buildLinePath(engagementPoints), [engagementPoints]);

  const genderCircumference = 2 * Math.PI * 62;
  let genderOffset = genderCircumference * 0.25;
  const genderSegments = detail.genderDistribution.map((item) => {
    const segmentLength = (item.value / 100) * genderCircumference;
    const segment = {
      ...item,
      segmentLength,
      offset: genderOffset,
    };
    genderOffset -= segmentLength;
    return segment;
  });

  return (
    <div className="workspace-stack post-detail-shell">
      <button type="button" className="post-detail-back" onClick={onBack}>
        <FiArrowLeft />
        <span>Volver al Dashboard</span>
      </button>

      <header className="post-detail-header">
        <h2>Detalle de Publicacion</h2>

        <div className="post-detail-meta">
          <span className="post-detail-platform">
            <PlatformIcon />
            {publication.platform.name}
          </span>
          <span>{formatLongDate(publication.created_at)} - {formatTimeLabel(publication.created_at)}</span>
          <span className="post-detail-status">Publicado</span>
        </div>
      </header>

      <section className="post-detail-grid">
        <div className="post-detail-main">
          <article className="card post-detail-content-card">
            <h3>Contenido</h3>

            <div
              className="post-detail-hero"
              style={{
                background: `linear-gradient(135deg, ${publication.platform.color}18 0%, #f8e8f8 100%)`,
              }}
            >
              <div className="post-detail-hero-icon" style={{ color: publication.platform.color }}>
                <FiImage />
              </div>
              <span>Imagen de la publicacion</span>
            </div>

            <div className="post-detail-copy">
              {contentParagraphs.length
                ? contentParagraphs.map((paragraph, index) => <p key={`${publication.publication_id}-${index}`}>{paragraph}</p>)
                : <p>{getReadableContent(publication.content, "Publicacion lista para revisar en detalle.")}</p>}
            </div>
          </article>

          <article className="card post-detail-chart-card">
            <h3>Engagement en el Tiempo</h3>

            <div className="post-detail-chart-wrap">
              <svg viewBox="0 0 820 320" aria-label="Engagement en el tiempo">
                {[0, 1, 2, 3].map((row) => {
                  const y = 76 + row * 50;
                  const labelValue = Math.round(((Math.max(...detail.hourValues) + 120) * (4 - row)) / 4);
                  return (
                    <g key={row}>
                      <line x1="60" y1={y} x2="760" y2={y} className="analytics-grid-line" />
                      <text x="12" y={y + 5} className="analytics-axis-label">
                        {labelValue}
                      </text>
                    </g>
                  );
                })}

                <line x1="60" y1="28" x2="60" y2="276" className="analytics-axis-line" />
                <line x1="60" y1="276" x2="760" y2="276" className="analytics-axis-line" />

                {engagementPoints.map((point) => (
                  <g key={point.label}>
                    <line x1={point.x} y1="28" x2={point.x} y2="276" className="analytics-grid-line vertical" />
                    <text x={point.x} y="300" textAnchor="middle" className="analytics-day-label">
                      {point.label}
                    </text>
                  </g>
                ))}

                <path d={engagementAreaPath} className="analytics-area-fill" />
                <path d={engagementLinePath} className="analytics-line-path blue" />
              </svg>
            </div>
          </article>

          <section className="post-detail-demographics-grid">
            <article className="card post-detail-age-card">
              <h3>Distribucion por Edad</h3>
              <div className="age-bars">
                {detail.ageDistribution.map((item) => (
                  <div key={item.label} className="age-bar-item">
                    <div className="age-bar-track">
                      <div className="age-bar-fill" style={{ height: `${item.value}%` }} />
                    </div>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="card post-detail-gender-card">
              <h3>Distribucion por Genero</h3>

              <div className="post-detail-gender-wrap">
                <svg viewBox="0 0 220 220" className="dashboard-donut-chart" aria-label="Distribucion por genero">
                  <circle cx="110" cy="110" r="62" className="donut-track" />
                  {genderSegments.map((segment) => (
                    <circle
                      key={segment.label}
                      cx="110"
                      cy="110"
                      r="62"
                      className="donut-segment"
                      style={{
                        stroke: segment.color,
                        strokeDasharray: `${segment.segmentLength} ${genderCircumference}`,
                        strokeDashoffset: segment.offset,
                      }}
                    />
                  ))}
                </svg>

                <div className="post-detail-gender-legend">
                  {detail.genderDistribution.map((item) => (
                    <div key={item.label} className="platform-legend-item">
                      <div className="platform-legend-name">
                        <span className="platform-legend-dot" style={{ backgroundColor: item.color }} />
                        <span>{item.label}</span>
                      </div>
                      <strong>{item.value}%</strong>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </section>

          <article className="card post-detail-locations-card">
            <h3>Ubicaciones Principales</h3>

            <div className="post-detail-locations-list">
              {detail.locations.map((location) => (
                <div key={location.label} className="post-detail-location-row">
                  <div className="post-detail-location-label">
                    <FiMapPin />
                    <span>{location.label}</span>
                  </div>
                  <div className="post-detail-location-bar">
                    <span style={{ width: `${location.percentage}%` }} />
                  </div>
                  <strong>{location.percentage}%</strong>
                  <small>{location.audience.toLocaleString("es-CO")}</small>
                </div>
              ))}
            </div>
          </article>

          <article className="card post-detail-comments-card">
            <h3>Comentarios Destacados</h3>

            <div className="post-detail-comments-list">
              {detail.comments.map((comment) => (
                <article key={`${comment.name}-${comment.time}`} className="post-comment-item">
                  <div className="post-comment-avatar">{comment.initial}</div>
                  <div className="post-comment-body">
                    <div className="post-comment-meta">
                      <strong>{comment.name}</strong>
                      <span>{comment.time}</span>
                    </div>
                    <p>{comment.text}</p>
                    <small>
                      <FiHeart />
                      {comment.likes}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          </article>
        </div>

        <aside className="post-detail-side">
          <article className="card post-detail-metrics-card">
            <h3>Metricas Principales</h3>
            <div className="post-detail-metrics-list">
              {[
                { label: "Likes", value: publication.total_likes, color: "#ec4899", icon: FiHeart },
                { label: "Comentarios", value: publication.total_comments, color: "#3b82f6", icon: FiMessageCircle },
                { label: "Compartidos", value: publication.total_shares, color: "#22c55e", icon: FiShare2 },
                { label: "Alcance", value: detail.reach.toLocaleString("es-CO"), color: "#a855f7", icon: FiEye },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="post-detail-metric-row" style={{ background: `${item.color}10` }}>
                    <div className="post-detail-metric-name">
                      <Icon style={{ color: item.color }} />
                      <span>{item.label}</span>
                    </div>
                    <strong>{item.value}</strong>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="card post-detail-summary-card">
            <h3>Resumen de Rendimiento</h3>
            <div className="post-detail-progress-list">
              {[
                { label: "Engagement Rate", value: `${detail.engagementRate}%`, width: Math.min(100, Number(detail.engagementRate) * 8), color: "#22c55e" },
                { label: "Impresiones", value: detail.impressions.toLocaleString("es-CO"), width: 78, color: "#2563eb" },
                { label: "Guardados", value: detail.saves.toLocaleString("es-CO"), width: 46, color: "#a855f7" },
              ].map((item) => (
                <div key={item.label} className="post-detail-progress-item">
                  <div className="post-detail-progress-head">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                  <div className="post-detail-progress-track">
                    <span style={{ width: `${item.width}%`, background: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="card post-detail-quick-card">
            <h3>Estadisticas Rapidas</h3>
            <div className="post-detail-quick-list">
              <div><span>Total Interacciones</span><strong>{detail.totalInteractions.toLocaleString("es-CO")}</strong></div>
              <div><span>Tasa de Clic</span><strong>{detail.clickRate}%</strong></div>
              <div><span>Tiempo Promedio</span><strong>{detail.averageTime}</strong></div>
              <div><span>Shares Rate</span><strong>{detail.shareRate}</strong></div>
            </div>
          </article>

          <article className="card post-detail-actions-card">
            <h3>Acciones</h3>
            <div className="post-detail-action-list">
              <button type="button" className="primary">
                <FiTrendingUp />
                <span>Promocionar Post</span>
              </button>
              <button type="button" className="ghost">
                <FiShare2 />
                <span>Compartir Nuevamente</span>
              </button>
              <button type="button" className="ghost">
                <FiExternalLink />
                <span>Exportar Reporte</span>
              </button>
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}

function SchedulerModule({ publications, onNavigate }) {
  const scheduledPublications = useMemo(() => {
    const source = [...publications]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, schedulerTemplates.length);

    return schedulerTemplates.map((template, index) => {
      const publication = source[index] || {};
      const dateKey = getDateKey(template.scheduledAt);

      return {
        id: publication.publication_id || `scheduled-${index}`,
        scheduledAt: template.scheduledAt,
        dateKey,
        longDate: formatLongDate(template.scheduledAt),
        timeLabel: formatTimeLabel(template.scheduledAt),
        platform: template.platform,
        content: getReadableContent(publication.content, template.fallback),
        total_likes: Number(publication.total_likes || 0),
        total_comments: Number(publication.total_comments || 0),
      };
    });
  }, [publications]);

  const [selectedDateKey, setSelectedDateKey] = useState(() =>
    scheduledPublications[0]?.dateKey || getDateKey(new Date())
  );

  const [visibleMonth, setVisibleMonth] = useState(() => new Date("2026-03-01T00:00:00"));

  useEffect(() => {
    if (!scheduledPublications.length) return;
    setSelectedDateKey((current) => current || scheduledPublications[0].dateKey);
  }, [scheduledPublications]);

  const markedDateKeys = useMemo(
    () => new Set(scheduledPublications.map((publication) => publication.dateKey)),
    [scheduledPublications]
  );

  const calendarDays = useMemo(
    () => buildCalendarDays(visibleMonth, markedDateKeys),
    [markedDateKeys, visibleMonth]
  );

  const selectedDatePosts = useMemo(
    () => scheduledPublications.filter((publication) => publication.dateKey === selectedDateKey),
    [scheduledPublications, selectedDateKey]
  );

  const selectedDateLabel = selectedDatePosts[0]?.longDate || formatLongDate(selectedDateKey);
  const monthlyPostsCount = scheduledPublications.filter((publication) => {
    const date = new Date(publication.scheduledAt);
    return (
      date.getFullYear() === visibleMonth.getFullYear() &&
      date.getMonth() === visibleMonth.getMonth()
    );
  }).length;

  return (
    <div className="workspace-stack scheduler-shell">
      <header className="scheduler-header">
        <div>
          <h2>Programador de Posts</h2>
          <p>Gestiona y programa tus publicaciones</p>
        </div>

        <button type="button" className="primary scheduler-create-button" onClick={() => onNavigate?.("create")}>
          <FiClock />
          <span>Nueva Programacion</span>
        </button>
      </header>

      <section className="scheduler-top-grid">
        <article className="card scheduler-panel">
          <h3>Calendario</h3>

          <div className="calendar-frame">
            <div className="calendar-header">
              <button
                type="button"
                className="calendar-nav-button"
                onClick={() =>
                  setVisibleMonth(
                    new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1)
                  )
                }
              >
                <FiChevronLeft />
              </button>
              <strong>{formatMonthLabel(visibleMonth)}</strong>
              <button
                type="button"
                className="calendar-nav-button"
                onClick={() =>
                  setVisibleMonth(
                    new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1)
                  )
                }
              >
                <FiChevronRight />
              </button>
            </div>

            <div className="calendar-weekdays">
              {["lu", "ma", "mi", "ju", "vi", "sa", "do"].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>

            <div className="calendar-grid">
              {calendarDays.map((day) => (
                <button
                  key={day.key}
                  type="button"
                  className={`calendar-day${
                    day.isCurrentMonth ? "" : " muted"
                  }${selectedDateKey === day.key ? " selected" : ""}${day.isMarked ? " marked" : ""}`}
                  onClick={() => setSelectedDateKey(day.key)}
                >
                  <span>{day.dayNumber}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="calendar-summary">
            <div className="calendar-summary-item">
              <span>Posts programados</span>
              <strong>{scheduledPublications.length}</strong>
            </div>
            <div className="calendar-summary-item">
              <span>Este mes</span>
              <strong>{monthlyPostsCount}</strong>
            </div>
          </div>
        </article>

        <article className="card scheduler-panel">
          <h3>Posts para {selectedDateLabel}</h3>

          <div className="schedule-list">
            {selectedDatePosts.map((publication) => {
              const PlatformIcon = publication.platform.icon;

              return (
                <article key={publication.id} className="schedule-card">
                  <div className="schedule-card-left">
                    <div
                      className="schedule-platform-icon"
                      style={{
                        color: publication.platform.color,
                        backgroundColor: `${publication.platform.color}14`,
                      }}
                    >
                      <PlatformIcon />
                    </div>

                    <div className="schedule-card-copy">
                      <div className="schedule-card-meta">
                        <strong>{publication.platform.name}</strong>
                        <span>{publication.timeLabel}</span>
                      </div>
                      <p>{publication.content}</p>
                    </div>
                  </div>

                  <div className="schedule-card-actions">
                    <button type="button" className="schedule-action" aria-label="Editar">
                      <FiEdit2 />
                    </button>
                    <button type="button" className="schedule-action danger" aria-label="Eliminar">
                      <FiTrash2 />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </article>
      </section>

      <article className="card scheduler-bottom-card">
        <h3>Proximas Publicaciones</h3>

        <div className="upcoming-list">
          {scheduledPublications.map((publication) => {
            const PlatformIcon = publication.platform.icon;

            return (
              <article key={`timeline-${publication.id}`} className="upcoming-item">
                <div className="upcoming-line" />
                <div
                  className="upcoming-platform-icon"
                  style={{
                    color: publication.platform.color,
                    backgroundColor: `${publication.platform.color}14`,
                  }}
                >
                  <PlatformIcon />
                </div>

                <div className="upcoming-copy">
                  <div className="upcoming-meta">
                    <strong>{publication.longDate}</strong>
                    <span>{publication.timeLabel}</span>
                  </div>
                  <p>{publication.content}</p>
                </div>
              </article>
            );
          })}
        </div>
      </article>
    </div>
  );
}

function CreateModule() {
  const [aiMode, setAiMode] = useState("text");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("Profesional");
  const [selectedPlatforms, setSelectedPlatforms] = useState(["Instagram"]);
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImageField, setShowImageField] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("2026-03-20");
  const [scheduleTime, setScheduleTime] = useState("10:00");
  const [statusMessage, setStatusMessage] = useState("");

  const primaryPlatform =
    platformSequence.find((platform) => selectedPlatforms.includes(platform.name)) || platformSequence[0];
  const PreviewIcon = primaryPlatform.icon;

  const togglePlatform = (platformName) => {
    setSelectedPlatforms((current) => {
      if (current.includes(platformName)) {
        if (current.length === 1) return current;
        return current.filter((platform) => platform !== platformName);
      }

      return [...current, platformName];
    });
  };

  const generateCopy = () => {
    const cleanTopic = topic.trim() || "una nueva propuesta de valor para la marca";
    const platformLabel = selectedPlatforms.join(", ");

    const intros = {
      Profesional: "Presentamos una propuesta pensada para generar confianza y conversion.",
      Cercano: "Queremos contarte algo que puede ayudarte a conectar mejor con tu audiencia.",
      Inspirador: "A veces una buena idea necesita el mensaje correcto para empezar a crecer.",
    };

    const endings = {
      Profesional: `Ideal para comunicar en ${platformLabel} con un enfoque claro, directo y orientado a resultados.`,
      Cercano: `Perfecto para conversar con tu comunidad en ${platformLabel} con un tono cercano y natural.`,
      Inspirador: `Pensado para mover a tu audiencia en ${platformLabel} con un mensaje memorable y optimista.`,
    };

    setContent(`${intros[tone]} ${cleanTopic}. ${endings[tone]}`);
    setStatusMessage("Borrador generado con IA visual.");
  };

  const improveCopy = () => {
    if (!content.trim()) {
      generateCopy();
      return;
    }

    setContent((current) => `${current.trim()} CTA sugerido: escribe por DM o visita el enlace de la bio para conocer mas.`);
    setStatusMessage("Texto mejorado.");
  };

  const addHashtags = () => {
    const baseTags = topic
      .toLowerCase()
      .split(/[^a-z0-9áéíóúñ]+/i)
      .filter((word) => word.length > 3)
      .slice(0, 3)
      .map((word) => `#${word}`);

    const platformTag = `#${primaryPlatform.name.replace(/[^a-z]/gi, "")}`;
    const tags = [...new Set([...baseTags, "#marketingdigital", "#socialmedia", platformTag])];
    setContent((current) => `${current.trim()} ${tags.join(" ")}`.trim());
    setStatusMessage("Hashtags agregados.");
  };

  const addEmoji = () => {
    setContent((current) => `${current}${current ? " " : ""}✨`);
  };

  const submitNow = () => {
    if (!content.trim()) {
      setStatusMessage("Escribe o genera contenido antes de publicar.");
      return;
    }

    setStatusMessage("Post listo en modo demo. Cuando reconstruyas la API, aqui puedes conectar la publicacion real.");
  };

  const schedulePost = () => {
    if (!content.trim()) {
      setStatusMessage("Escribe o genera contenido antes de programarlo.");
      return;
    }

    setStatusMessage(`Post programado visualmente para ${scheduleDate} a las ${scheduleTime}.`);
  };

  return (
    <div className="workspace-stack create-post-shell">
      <header className="create-post-header">
        <div>
          <h2>Crear Post</h2>
          <p>Crea y programa contenido para tus redes sociales</p>
        </div>
      </header>

      {statusMessage ? <div className="success-banner">{statusMessage}</div> : null}

      <section className="create-post-grid">
        <div className="create-post-main">
          <article className="card ai-generator-card">
            <div className="create-card-title">
              <FiZap />
              <h3>Crear con IA</h3>
            </div>

            <div className="ai-mode-switch">
              <button
                type="button"
                className={`ai-mode-button${aiMode === "text" ? " active" : ""}`}
                onClick={() => setAiMode("text")}
              >
                Texto con IA
              </button>
              <button
                type="button"
                className={`ai-mode-button${aiMode === "image" ? " active" : ""}`}
                onClick={() => setAiMode("image")}
              >
                Imagen con IA
              </button>
            </div>

            <div className="create-form-stack">
              <label className="create-field">
                <span>Sobre que quieres crear contenido?</span>
                <input
                  type="text"
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  placeholder="Ej: Lanzamiento de producto, consejos de marketing, promocion especial..."
                />
              </label>

              <label className="create-field">
                <span>Tono del mensaje</span>
                <select value={tone} onChange={(event) => setTone(event.target.value)}>
                  <option>Profesional</option>
                  <option>Cercano</option>
                  <option>Inspirador</option>
                </select>
              </label>

              <div className="create-action-row">
                <button type="button" className="create-generate-button" onClick={generateCopy}>
                  <FiZap />
                  <span>Generar</span>
                </button>
                <button type="button" className="ghost create-secondary-action" onClick={improveCopy}>
                  <FiActivity />
                  <span>Mejorar</span>
                </button>
                <button type="button" className="ghost create-secondary-action" onClick={addHashtags}>
                  <FiHash />
                  <span>Hashtags</span>
                </button>
              </div>
            </div>
          </article>

          <article className="card create-content-card">
            <h3>Contenido del Post</h3>

            <textarea
              className="create-post-textarea"
              rows={8}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="¿Que quieres compartir con tu audiencia?"
            />

            <div className="create-post-toolbar">
              <div className="create-post-toolbar-left">
                <button type="button" className="ghost create-tool-button" onClick={() => setShowImageField((current) => !current)}>
                  <FiImage />
                  <span>Añadir Imagen</span>
                </button>
                <button type="button" className="ghost create-tool-button" onClick={addEmoji}>
                  <FiSmile />
                  <span>Emojis</span>
                </button>
              </div>

              <span className="character-counter">{content.length} caracteres</span>
            </div>

            {showImageField ? (
              <label className="create-field image-url-field">
                <span>URL de la imagen</span>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                  placeholder="https://..."
                />
              </label>
            ) : null}
          </article>

          <article className="card create-schedule-card">
            <h3>Programacion</h3>

            <div className="create-schedule-grid">
              <label className="create-field">
                <span>Fecha</span>
                <div className="create-input-with-icon">
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(event) => setScheduleDate(event.target.value)}
                  />
                  <FiCalendar />
                </div>
              </label>

              <label className="create-field">
                <span>Hora</span>
                <div className="create-input-with-icon">
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(event) => setScheduleTime(event.target.value)}
                  />
                  <FiClock />
                </div>
              </label>
            </div>
          </article>

          <div className="create-submit-row">
            <button type="button" className="primary create-submit-button" onClick={submitNow}>
              <FiSend />
              <span>Publicar Ahora</span>
            </button>
            <button type="button" className="ghost create-submit-button secondary" onClick={schedulePost}>
              <FiClock />
              <span>Programar</span>
            </button>
          </div>
        </div>

        <aside className="create-post-side">
          <article className="card platform-selector-card">
            <h3>Plataformas</h3>

            <div className="platform-selector-list">
              {platformSequence.map((platform) => {
                const Icon = platform.icon;
                const selected = selectedPlatforms.includes(platform.name);

                return (
                  <button
                    key={platform.name}
                    type="button"
                    className={`platform-selector-item${selected ? " active" : ""}`}
                    onClick={() => togglePlatform(platform.name)}
                  >
                    <div className="platform-selector-main">
                      <div
                        className="platform-selector-icon"
                        style={{
                          background: `${platform.color}14`,
                          color: platform.color,
                        }}
                      >
                        <Icon />
                      </div>
                      <span>{platform.name}</span>
                    </div>

                    {selected ? (
                      <span className="platform-selector-check">
                        <FiCheck />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </article>

          <article className="card preview-card">
            <h3>Vista Previa</h3>

            <div className="preview-frame">
              <div className="preview-header">
                <div
                  className="preview-platform-icon"
                  style={{
                    background: `${primaryPlatform.color}14`,
                    color: primaryPlatform.color,
                  }}
                >
                  <PreviewIcon />
                </div>
                <div>
                  <strong>{primaryPlatform.name}</strong>
                  <span>Post listo para revisar</span>
                </div>
              </div>

              <p>{content.trim() || "La vista previa aparecera aqui"}</p>

              {imageUrl ? (
                <div className="preview-image-box">
                  <span>Imagen enlazada</span>
                  <small>{imageUrl}</small>
                </div>
              ) : (
                <div className="preview-empty-box">La vista previa aparecera aqui</div>
              )}
            </div>
          </article>

          <article className="card best-times-card">
            <h3>Mejores Horarios</h3>

            <div className="best-times-list">
              {[
                ["Instagram", "10:00 - 14:00"],
                ["Twitter", "12:00 - 15:00"],
                ["Facebook", "09:00 - 13:00"],
                ["LinkedIn", "08:00 - 10:00"],
              ].map(([platform, range]) => (
                <div key={platform} className="best-times-item">
                  <span>{platform}</span>
                  <strong>{range}</strong>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}

function AudienceModule({ users, publications }) {
  const [statusMessage, setStatusMessage] = useState("");

  const connectedAccounts = useMemo(
    () => [
      {
        id: "instagram",
        name: "Instagram",
        handle: "@mi_empresa",
        followers: 18.5,
        engagement: 8.4,
        status: "Conectada",
        icon: FiInstagram,
        color: "#e72f6f",
      },
      {
        id: "twitter",
        name: "Twitter",
        handle: "@mi_empresa",
        followers: 12.3,
        engagement: 6.2,
        status: "Conectada",
        icon: FiTwitter,
        color: "#4a97f4",
      },
      {
        id: "facebook",
        name: "Facebook",
        handle: "Mi Empresa",
        followers: 24.1,
        engagement: 5.8,
        status: "Conectada",
        icon: FiFacebook,
        color: "#2563eb",
      },
      {
        id: "linkedin",
        name: "LinkedIn",
        handle: "Mi Empresa",
        followers: 8.7,
        engagement: 4.3,
        status: "Conectada",
        icon: FiLinkedin,
        color: "#1d4ed8",
      },
    ],
    []
  );

  const totalFollowers = useMemo(
    () => connectedAccounts.reduce((acc, account) => acc + account.followers, 0),
    [connectedAccounts]
  );

  const averageEngagement = useMemo(
    () =>
      connectedAccounts.length
        ? connectedAccounts.reduce((acc, account) => acc + account.engagement, 0) / connectedAccounts.length
        : 0,
    [connectedAccounts]
  );

  const totalAccounts = connectedAccounts.length || users.length;
  const topStats = [
    {
      label: "Total Cuentas",
      value: totalAccounts,
      icon: FiUsers,
      accent: "blue",
    },
    {
      label: "Seguidores Totales",
      value: `${totalFollowers.toFixed(1)}K`,
      icon: FiUsers,
      accent: "green",
    },
    {
      label: "Engagement Promedio",
      value: `${averageEngagement.toFixed(1)}%`,
      icon: FiTrendingUp,
      accent: "purple",
    },
  ];

  return (
    <div className="workspace-stack accounts-shell">
      <header className="accounts-header">
        <div>
          <h2>Cuentas Conectadas</h2>
          <p>Gestiona tus perfiles de redes sociales</p>
        </div>

        <button
          type="button"
          className="primary accounts-connect-button"
          onClick={() =>
            setStatusMessage(
              `Modo visual activo: ${publications.length} publicaciones ya estan listas para enlazarse cuando conectes tu nueva API.`
            )
          }
        >
          <FiPlus />
          <span>Conectar Cuenta</span>
        </button>
      </header>

      {statusMessage ? <div className="success-banner">{statusMessage}</div> : null}

      <section className="accounts-stats-grid">
        {topStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article key={stat.label} className="accounts-stat-card">
              <div className="accounts-stat-copy">
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
              <div className={`dashboard-stat-icon ${stat.accent}`}>
                <Icon />
              </div>
            </article>
          );
        })}
      </section>

      <section className="accounts-grid">
        {connectedAccounts.map((account) => {
          const Icon = account.icon;

          return (
            <article key={account.id} className="card account-card">
              <div className="account-card-header">
                <div className="account-card-main">
                  <div
                    className="account-platform-icon"
                    style={{
                      background: account.color,
                    }}
                  >
                    <Icon />
                  </div>
                  <div>
                    <strong>{account.name}</strong>
                    <span>{account.handle}</span>
                  </div>
                </div>

                <span className="account-status-badge">{account.status}</span>
              </div>

              <div className="account-metrics-grid">
                <div className="account-metric-box">
                  <span>Seguidores</span>
                  <strong>{account.followers.toFixed(1)}K</strong>
                </div>
                <div className="account-metric-box">
                  <span>Engagement</span>
                  <strong>{account.engagement.toFixed(1)}%</strong>
                </div>
              </div>

              <div className="account-card-actions">
                <button
                  type="button"
                  className="ghost account-card-button"
                  onClick={() => setStatusMessage(`Configuracion visual abierta para ${account.name}.`)}
                >
                  <FiSettings />
                  <span>Configurar</span>
                </button>
                <button
                  type="button"
                  className="ghost account-card-button"
                  onClick={() => setStatusMessage(`Detalle rapido: ${account.name} tiene ${account.followers.toFixed(1)}K seguidores.`)}
                >
                  <FiExternalLink />
                  <span>Ver Detalles</span>
                </button>
              </div>
            </article>
          );
        })}
      </section>

      <article className="card connect-account-card">
        <div className="connect-account-plus">
          <FiPlus />
        </div>
        <h3>Conectar Nueva Cuenta</h3>
        <p>Agrega mas perfiles de redes sociales para gestionar todo en un solo lugar</p>
        <button
          type="button"
          className="primary accounts-connect-button center"
          onClick={() =>
            setStatusMessage(
              `Listo para el siguiente paso: conectar OAuth real para ${users.length || totalAccounts} perfiles de trabajo desde tu nuevo backend.`
            )
          }
        >
          Conectar Cuenta
        </button>
      </article>
    </div>
  );
}

// eslint-disable-next-line no-unused-vars
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

function AnalyticsWorkspaceModule({ publications }) {
  const [selectedRange, setSelectedRange] = useState(30);
  const rangeLabels = [7, 30, 90];
  const rangeScaleMap = { 7: 0.72, 30: 1, 90: 1.38 };

  const analyticsPublications = useMemo(
    () =>
      publications.map((publication, index) => {
        const platform = platformSequence[index % platformSequence.length];
        const likes = Number(publication.total_likes || 0);
        const comments = Number(publication.total_comments || 0);
        const shares = Number(publication.total_shares || 0);

        return {
          ...publication,
          platform,
          likes,
          comments,
          shares,
          interactions: likes + comments + shares,
          safeContent: getReadableContent(publication.content, recentPostFallbacks[index % recentPostFallbacks.length]),
          displayDate: publication.published_date || publication.scheduled_date || publication.created_at,
        };
      }),
    [publications]
  );

  const baseTotals = useMemo(
    () =>
      analyticsPublications.reduce(
        (acc, publication) => {
          acc.likes += publication.likes;
          acc.comments += publication.comments;
          acc.shares += publication.shares;
          return acc;
        },
        { likes: 0, comments: 0, shares: 0 }
      ),
    [analyticsPublications]
  );

  const rangePreset = useMemo(() => {
    const commentsOffset = Math.min(35, Math.round(baseTotals.comments / 10));
    const shareOffset = Math.min(40, Math.round(baseTotals.shares / 8));

    return {
      7: {
        followerLabels: ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"],
        followers: [39800, 40700, 42100, 43800, 45100, 46800, 48200],
        activityLabels: ["00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00"],
        activityValues: [120, 90, 150, 420, 610, 740, 860, 640].map((value, index) => value + commentsOffset + index * 4),
        contentValues: [74, 63, 58, 49, 56, 81],
        metricChanges: {
          reach: "+8.6%",
          likes: "+6.4%",
          comments: "+5.1%",
          shares: "-1.4%",
        },
      },
      30: {
        followerLabels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
        followers: [42000, 43500, 45100, 44800, 46300, 47200],
        activityLabels: ["00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00"],
        activityValues: [110, 80, 150, 450, 680, 720, 900, 650].map((value, index) => value + commentsOffset + index * 5),
        contentValues: [88, 72, 64, 50, 61, 93],
        metricChanges: {
          reach: "+24.1%",
          likes: "+18.3%",
          comments: "+12.7%",
          shares: "-3.2%",
        },
      },
      90: {
        followerLabels: ["Oct", "Nov", "Dic", "Ene", "Feb", "Mar"],
        followers: [35600, 37200, 40100, 43600, 46300, 48900],
        activityLabels: ["00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00"],
        activityValues: [95, 70, 130, 390, 580, 670, 830, 590].map((value, index) => value + shareOffset + index * 3),
        contentValues: [84, 68, 62, 53, 58, 90],
        metricChanges: {
          reach: "+31.9%",
          likes: "+22.4%",
          comments: "+16.9%",
          shares: "-0.8%",
        },
      },
    }[selectedRange];
  }, [baseTotals.comments, baseTotals.shares, selectedRange]);

  const rangeScale = rangeScaleMap[selectedRange] || 1;

  const metricCards = useMemo(
    () => [
      {
        label: "Alcance Total",
        value: formatCompactMetric((240000 + baseTotals.likes * 28 + baseTotals.comments * 96 + baseTotals.shares * 140) * rangeScale),
        change: rangePreset.metricChanges.reach,
        positive: true,
        icon: FiEye,
        accent: "blue",
      },
      {
        label: "Total Likes",
        value: formatCompactMetric((12000 + baseTotals.likes * 26) * rangeScale),
        change: rangePreset.metricChanges.likes,
        positive: true,
        icon: FiHeart,
        accent: "pink",
      },
      {
        label: "Comentarios",
        value: formatCompactMetric((900 + baseTotals.comments * 18) * rangeScale),
        change: rangePreset.metricChanges.comments,
        positive: true,
        icon: FiMessageCircle,
        accent: "green",
      },
      {
        label: "Compartidos",
        value: formatCompactMetric((500 + baseTotals.shares * 24) * rangeScale),
        change: rangePreset.metricChanges.shares,
        positive: !rangePreset.metricChanges.shares.startsWith("-"),
        icon: FiShare2,
        accent: "purple",
      },
    ],
    [baseTotals.comments, baseTotals.likes, baseTotals.shares, rangePreset.metricChanges, rangeScale]
  );

  const followerChart = useMemo(() => {
    const width = 760;
    const height = 320;
    const baselineY = 274;
    const maxValue = Math.max(...rangePreset.followers, 1) + 6000;
    const points = buildSvgPoints(rangePreset.followerLabels, rangePreset.followers, {
      width,
      height,
      left: 76,
      right: 28,
      top: 34,
      bottom: 46,
      maxValue,
    });

    return {
      width,
      height,
      baselineY,
      maxValue,
      points,
      linePath: buildLinePath(points),
      areaPath: buildAreaPath(points, baselineY),
    };
  }, [rangePreset.followerLabels, rangePreset.followers]);

  const platformBarData = useMemo(() => {
    const grouped = platformSequence.reduce((acc, platform) => {
      acc[platform.name] = {
        ...platform,
        likes: 0,
        comments: 0,
        shares: 0,
      };
      return acc;
    }, {});

    analyticsPublications.forEach((publication) => {
      const target = grouped[publication.platform.name];
      target.likes += publication.likes;
      target.comments += publication.comments;
      target.shares += publication.shares;
    });

    return platformSequence.map((platform, index) => {
      const values = grouped[platform.name];
      return {
        ...platform,
        likes: Math.round((1200 + values.likes * 16) * rangeScale + [260, 180, 220, 120][index]),
        comments: Math.round((900 + values.comments * 22) * rangeScale + [320, 220, 280, 160][index]),
        shares: Math.round((1600 + values.shares * 28) * rangeScale + [420, 260, 360, 180][index]),
      };
    });
  }, [analyticsPublications, rangeScale]);

  const contentCategories = ["Videos", "Imagenes", "Carruseles", "Texto", "Stories", "Reels"];
  const radarPoints = useMemo(
    () =>
      buildRadarPolygon(rangePreset.contentValues, {
        centerX: 190,
        centerY: 150,
        radius: 98,
        maxValue: 100,
      }),
    [rangePreset.contentValues]
  );

  const activityChart = useMemo(() => {
    const width = 760;
    const height = 320;
    const maxValue = Math.max(...rangePreset.activityValues, 1) + 100;
    const points = buildSvgPoints(rangePreset.activityLabels, rangePreset.activityValues, {
      width,
      height,
      left: 76,
      right: 28,
      top: 34,
      bottom: 46,
      maxValue,
    });

    return {
      width,
      height,
      maxValue,
      points,
      linePath: buildLinePath(points),
    };
  }, [rangePreset.activityLabels, rangePreset.activityValues]);

  const topPublications = useMemo(
    () => [...analyticsPublications].sort((a, b) => b.interactions - a.interactions).slice(0, 4),
    [analyticsPublications]
  );

  const engagementLegend = [
    { label: "Likes", className: "likes" },
    { label: "Comentarios", className: "comments" },
    { label: "Compartidos", className: "shares" },
  ];

  return (
    <div className="workspace-stack analytics-shell">
      <header className="analytics-header">
        <div>
          <h2>Analiticas</h2>
          <p>Analisis detallado del rendimiento de tus redes sociales</p>
        </div>

        <div className="analytics-range-toggle" role="tablist" aria-label="Rango de tiempo">
          {rangeLabels.map((range) => (
            <button
              key={range}
              type="button"
              className={`analytics-range-pill ${selectedRange === range ? "active" : ""}`}
              onClick={() => setSelectedRange(range)}
            >
              {range} dias
            </button>
          ))}
        </div>
      </header>

      <section className="analytics-stats-grid">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className="analytics-stat-card">
              <div className="analytics-stat-copy">
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <small className={card.positive ? "positive" : "negative"}>{card.change}</small>
              </div>
              <div className={`dashboard-stat-icon ${card.accent}`}>
                <Icon />
              </div>
            </article>
          );
        })}
      </section>

      <section className="analytics-chart-grid">
        <article className="card analytics-chart-card">
          <h3>Crecimiento de Seguidores</h3>

          <div className="analytics-svg-wrap">
            <svg viewBox={`0 0 ${followerChart.width} ${followerChart.height}`} aria-label="Crecimiento de seguidores">
              {[0, 1, 2, 3].map((row) => {
                const y = 74 + row * 50;
                const labelValue = Math.round((followerChart.maxValue * (4 - row)) / 4);

                return (
                  <g key={row}>
                    <line x1="76" y1={y} x2="720" y2={y} className="analytics-grid-line" />
                    <text x="16" y={y + 5} className="analytics-axis-label">
                      {labelValue}
                    </text>
                  </g>
                );
              })}

              <line x1="76" y1="34" x2="76" y2={followerChart.baselineY} className="analytics-axis-line" />
              <line x1="76" y1={followerChart.baselineY} x2="720" y2={followerChart.baselineY} className="analytics-axis-line" />

              {followerChart.points.map((point) => (
                <g key={point.label}>
                  <line x1={point.x} y1="34" x2={point.x} y2={followerChart.baselineY} className="analytics-grid-line vertical" />
                  <text x={point.x} y="296" textAnchor="middle" className="analytics-day-label">
                    {point.label}
                  </text>
                </g>
              ))}

              <path d={followerChart.areaPath} className="analytics-area-fill" />
              <path d={followerChart.linePath} className="analytics-line-path blue" />
            </svg>
          </div>
        </article>

        <article className="card analytics-chart-card">
          <h3>Engagement por Plataforma</h3>

          <div className="analytics-svg-wrap">
            <svg viewBox="0 0 760 320" aria-label="Engagement por plataforma">
              {[0, 1, 2, 3].map((row) => {
                const y = 74 + row * 50;
                return (
                  <g key={row}>
                    <line x1="76" y1={y} x2="720" y2={y} className="analytics-grid-line" />
                    <text x="20" y={y + 5} className="analytics-axis-label">
                      {Math.round((9000 * (4 - row)) / 4)}
                    </text>
                  </g>
                );
              })}

              <line x1="76" y1="34" x2="76" y2="274" className="analytics-axis-line" />
              <line x1="76" y1="274" x2="720" y2="274" className="analytics-axis-line" />

              {platformBarData.map((platform, index) => {
                const centerX = 134 + index * 154;
                const baseY = 274;
                const heights = {
                  likes: (platform.likes / 9000) * 200,
                  comments: (platform.comments / 9000) * 200,
                  shares: (platform.shares / 9000) * 200,
                };

                return (
                  <g key={platform.name}>
                    <text x={centerX} y="296" textAnchor="middle" className="analytics-day-label">
                      {platform.name}
                    </text>
                    <rect x={centerX - 31} y={baseY - heights.likes} width="18" height={heights.likes} rx="9" className="analytics-bar likes" />
                    <rect x={centerX - 9} y={baseY - heights.comments} width="18" height={heights.comments} rx="9" className="analytics-bar comments" />
                    <rect x={centerX + 13} y={baseY - heights.shares} width="18" height={heights.shares} rx="9" className="analytics-bar shares" />
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="analytics-legend">
            {engagementLegend.map((item) => (
              <div key={item.label} className="analytics-legend-item">
                <span className={`analytics-legend-dot ${item.className}`} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="card analytics-chart-card">
          <h3>Rendimiento por Tipo de Contenido</h3>

          <div className="analytics-radar-wrap">
            <svg viewBox="0 0 380 300" aria-label="Rendimiento por tipo de contenido">
              {[25, 50, 75, 100].map((ring) => {
                const ringPoints = buildRadarPolygon(new Array(contentCategories.length).fill(ring), {
                  centerX: 190,
                  centerY: 150,
                  radius: 98,
                  maxValue: 100,
                });

                return (
                  <polygon
                    key={ring}
                    points={ringPoints.map((point) => `${point.x},${point.y}`).join(" ")}
                    className="analytics-radar-ring"
                  />
                );
              })}

              {contentCategories.map((label, index) => {
                const angle = ((-90 + (360 / contentCategories.length) * index) * Math.PI) / 180;
                const x = 190 + Math.cos(angle) * 116;
                const y = 150 + Math.sin(angle) * 116;

                return (
                  <g key={label}>
                    <line x1="190" y1="150" x2={190 + Math.cos(angle) * 98} y2={150 + Math.sin(angle) * 98} className="analytics-radar-axis" />
                    <text x={x} y={y} textAnchor="middle" className="analytics-radar-label">
                      {label}
                    </text>
                  </g>
                );
              })}

              <polygon points={radarPoints.map((point) => `${point.x},${point.y}`).join(" ")} className="analytics-radar-polygon" />
              {radarPoints.map((point, index) => (
                <circle key={contentCategories[index]} cx={point.x} cy={point.y} r="5" className="analytics-radar-point" />
              ))}
            </svg>
          </div>
        </article>

        <article className="card analytics-chart-card">
          <h3>Actividad por Hora</h3>

          <div className="analytics-svg-wrap">
            <svg viewBox={`0 0 ${activityChart.width} ${activityChart.height}`} aria-label="Actividad por hora">
              {[0, 1, 2, 3].map((row) => {
                const y = 74 + row * 50;
                const labelValue = Math.round((activityChart.maxValue * (4 - row)) / 4);

                return (
                  <g key={row}>
                    <line x1="76" y1={y} x2="720" y2={y} className="analytics-grid-line" />
                    <text x="22" y={y + 5} className="analytics-axis-label">
                      {labelValue}
                    </text>
                  </g>
                );
              })}

              <line x1="76" y1="34" x2="76" y2="274" className="analytics-axis-line" />
              <line x1="76" y1="274" x2="720" y2="274" className="analytics-axis-line" />

              {activityChart.points.map((point) => (
                <g key={point.label}>
                  <line x1={point.x} y1="34" x2={point.x} y2="274" className="analytics-grid-line vertical" />
                  <text x={point.x} y="296" textAnchor="middle" className="analytics-day-label">
                    {point.label}
                  </text>
                </g>
              ))}

              <path d={activityChart.linePath} className="analytics-line-path orange" />
              {activityChart.points.map((point) => (
                <circle key={point.label} cx={point.x} cy={point.y} r="6" className="analytics-line-point orange" />
              ))}
            </svg>
          </div>
        </article>
      </section>

      <article className="card analytics-top-posts-card">
        <h3>Posts con Mejor Rendimiento</h3>

        <div className="analytics-top-posts-list">
          {topPublications.map((publication) => (
            <article key={publication.publication_id} className="analytics-top-post-item">
              <div className="analytics-post-copy">
                <div className="analytics-post-meta">
                  <strong>{publication.platform.name}</strong>
                  <span>{formatAnalyticsDate(publication.displayDate)}</span>
                </div>
                <p>{publication.safeContent}</p>
              </div>

              <div className="analytics-post-metrics">
                <div className="analytics-post-metric">
                  <strong>{publication.likes}</strong>
                  <span>Likes</span>
                </div>
                <div className="analytics-post-metric">
                  <strong>{publication.comments}</strong>
                  <span>Comentarios</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </article>
    </div>
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
          <strong>Sesion</strong>
          <span>Demo local activa</span>
        </article>
        <article className="settings-card">
          <strong>Datos</strong>
          <span>Dataset local de interfaz</span>
        </article>
      </div>
    </section>
  );
}

export default function OperationsWorkspace({ activeView, onNavigate }) {
  const { user } = useAuth();
  const [publications] = useState(() => getDemoPublications());
  const [users] = useState(() => getDemoUsers());
  const [selectedPublication, setSelectedPublication] = useState(null);

  useEffect(() => {
    if (activeView !== "dashboard") {
      setSelectedPublication(null);
    }
  }, [activeView]);

  const view = useMemo(() => {
    if (activeView === "dashboard" && selectedPublication) {
      return <PublicationDetailView publication={selectedPublication} onBack={() => setSelectedPublication(null)} />;
    }

    switch (activeView) {
      case "calendar":
        return <SchedulerModule publications={publications} onNavigate={onNavigate} />;
      case "create":
        return <CreateModule />;
      case "audience":
        return <AudienceModule users={users} publications={publications} />;
      case "analytics":
        return <AnalyticsWorkspaceModule publications={publications} />;
      case "settings":
        return <SettingsModule user={user} />;
      case "dashboard":
      default:
        return <DashboardHome publications={publications} users={users} onOpenPost={setSelectedPublication} />;
    }
  }, [activeView, onNavigate, publications, selectedPublication, user, users]);

  return view;
}
