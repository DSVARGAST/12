import React, { useState, useMemo, useCallback, useEffect } from "react";
import { FiBarChart2, FiHeart, FiMessageCircle, FiShare2 } from "react-icons/fi";
import { useAuth } from "./AuthContext";

const initialFilters = {
  search: "",
  startDate: "",
  endDate: "",
  minLikes: "",
  maxLikes: "",
};

const emptyForm = {
  content: "",
  imageUrl: "",
  totalLikes: "0",
  totalComments: "0",
  totalShares: "0",
};

function PublicationsManager() {
  const { apiBase, token, user, logout } = useAuth();
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [filterDraft, setFilterDraft] = useState(initialFilters);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const hasPermission = useCallback(
    (permission) => Boolean(user?.permissions?.[permission]),
    [user]
  );

  const formatDate = useCallback((value) => {
    if (!value) return "";
    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return String(value);
      return new Intl.DateTimeFormat("es-ES", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
    } catch (err) {
      return String(value);
    }
  }, []);

  const buildQueryString = useCallback((params) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.append(key, value);
      }
    });
    return query.toString();
  }, []);

  const loadPublications = useCallback(
    async (activeFilters) => {
      if (!token) return;
      setLoading(true);
      setError("");
      try {
        const queryString = buildQueryString(activeFilters);
        const url = `${apiBase}/api/publications${queryString ? `?${queryString}` : ""}`;
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.status === 401) {
          logout();
          return;
        }
        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(errorBody.message || "No se pudieron cargar las publicaciones");
        }
        const data = await response.json();
        setPublications(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Error desconocido al cargar las publicaciones");
      } finally {
        setLoading(false);
      }
    },
    [apiBase, token, logout, buildQueryString]
  );

  useEffect(() => {
    loadPublications(filters);
  }, [filters, loadPublications]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilterDraft((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = (event) => {
    event.preventDefault();
    setStatus("");
    setFilters(filterDraft);
  };

  const resetFilters = () => {
    setFilterDraft(initialFilters);
    setFilters(initialFilters);
    setStatus("Filtros reiniciados");
  };

  const openCreateForm = () => {
    if (!hasPermission("canCreate")) {
      setError("Tu usuario no tiene permisos para crear publicaciones.");
      return;
    }
    setEditingId(null);
    setFormData(emptyForm);
    setFormOpen(true);
    setError("");
    setStatus("");
  };

  const openEditForm = (publication) => {
    if (!hasPermission("canUpdate")) {
      setError("Tu usuario no tiene permisos para actualizar publicaciones.");
      return;
    }
    setEditingId(publication.publication_id);
    setFormData({
      content: publication.content || "",
      imageUrl: publication.image_url || "",
      totalLikes: String(publication.total_likes ?? 0),
      totalComments: String(publication.total_comments ?? 0),
      totalShares: String(publication.total_shares ?? 0),
    });
    setFormOpen(true);
    setError("");
    setStatus("");
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const submitForm = async (event) => {
    event.preventDefault();
    setError("");
    setStatus("");

    const payload = {
      content: formData.content.trim(),
      imageUrl: formData.imageUrl.trim() || null,
      totalLikes: Number(formData.totalLikes) || 0,
      totalComments: Number(formData.totalComments) || 0,
      totalShares: Number(formData.totalShares) || 0,
    };

    if (!payload.content) {
      setError("Debes ingresar el contenido de la publicación.");
      return;
    }

    const isEditing = Boolean(editingId);
    const permission = isEditing ? "canUpdate" : "canCreate";
    if (!hasPermission(permission)) {
      setError("No cuentas con permisos para guardar cambios.");
      return;
    }

    try {
      const url = isEditing
        ? `${apiBase}/api/publications/${editingId}`
        : `${apiBase}/api/publications`;
      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        logout();
        return;
      }
      if (response.status === 403) {
        setError("Tu usuario no tiene permisos para completar esta acción.");
        return;
      }
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || "No se pudo guardar la publicación");
      }

      await loadPublications(filters);
      setFormOpen(false);
      setFormData(emptyForm);
      setEditingId(null);
      setStatus(isEditing ? "Publicación actualizada." : "Publicación creada.");
    } catch (err) {
      setError(err.message || "Error desconocido al guardar la publicación");
    }
  };

  const deletePublication = async (publicationId) => {
    setError("");
    setStatus("");

    if (!hasPermission("canDelete")) {
      setError("Tu usuario no tiene permisos para eliminar publicaciones.");
      return;
    }

    if (!window.confirm("¿Deseas eliminar esta publicación?")) {
      return;
    }

    try {
      const response = await fetch(`${apiBase}/api/publications/${publicationId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        logout();
        return;
      }
      if (response.status === 403) {
        setError("No tienes permiso para eliminar publicaciones.");
        return;
      }
      if (response.status === 404) {
        setError("La publicación ya no existe.");
        await loadPublications(filters);
        return;
      }
      if (!response.ok && response.status !== 204) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || "No se pudo eliminar la publicación");
      }

      await loadPublications(filters);
      setStatus("Publicación eliminada correctamente.");
    } catch (err) {
      setError(err.message || "Error desconocido al eliminar la publicación");
    }
  };

  const exportToExcel = async () => {
    setError("");
    setStatus("");

    if (!hasPermission("canExport")) {
      setError("Tu usuario no tiene permisos para exportar información.");
      return;
    }

    try {
      const queryString = buildQueryString(filters);
      const url = `${apiBase}/api/publications/export${queryString ? `?${queryString}` : ""}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        logout();
        return;
      }
      if (response.status === 403) {
        setError("Tu usuario no puede exportar datos.");
        return;
      }
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || "No se pudo generar el archivo");
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = `publicaciones_${Date.now()}.xlsx`;
      anchor.click();
      window.URL.revokeObjectURL(downloadUrl);
      setStatus("Archivo de publicaciones exportado correctamente.");
    } catch (err) {
      setError(err.message || "Error desconocido al exportar las publicaciones");
    }
  };

  const configureTrigger = async () => {
    setError("");
    setStatus("");

    if (!hasPermission("canManageTriggers")) {
      setError("Tu usuario no puede administrar triggers.");
      return;
    }

    try {
      const response = await fetch(`${apiBase}/api/triggers/publication-log`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        logout();
        return;
      }
      if (response.status === 403) {
        setError("No cuentas con permisos para configurar triggers.");
        return;
      }
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || "No se pudo configurar el trigger");
      }

      const data = await response.json();
      setStatus(data.message || "Trigger configurado correctamente.");
    } catch (err) {
      setError(err.message || "Error desconocido al configurar el trigger");
    }
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const totalPublications = useMemo(() => publications.length, [publications]);
  const totalLikes = useMemo(
    () => publications.reduce((acc, publication) => acc + Number(publication.total_likes || 0), 0),
    [publications]
  );
  const totalComments = useMemo(
    () => publications.reduce((acc, publication) => acc + Number(publication.total_comments || 0), 0),
    [publications]
  );
  const totalShares = useMemo(
    () => publications.reduce((acc, publication) => acc + Number(publication.total_shares || 0), 0),
    [publications]
  );
  const averageLikes = useMemo(
    () => (totalPublications ? Math.round(totalLikes / totalPublications) : 0),
    [totalLikes, totalPublications]
  );
  const overviewCards = useMemo(
    () => [
      {
        label: "Publicaciones visibles",
        value: totalPublications,
        note: "Resultados segun filtros activos",
        icon: FiBarChart2,
      },
      {
        label: "Likes acumulados",
        value: totalLikes,
        note: "Suma del conjunto actual",
        icon: FiHeart,
      },
      {
        label: "Comentarios",
        value: totalComments,
        note: "Interacciones registradas",
        icon: FiMessageCircle,
      },
      {
        label: "Promedio de likes",
        value: averageLikes,
        note: `${totalShares} compartidos en total`,
        icon: FiShare2,
      },
    ],
    [averageLikes, totalComments, totalLikes, totalPublications, totalShares]
  );

  return (
    <section className="publications-view">
      <section className="overview-grid">
        {overviewCards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className="overview-card">
              <div className="overview-copy">
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <small>{card.note}</small>
              </div>
              <div className="overview-icon">
                <Icon />
              </div>
            </article>
          );
        })}
      </section>

      <section className="card publications-card">
      <header className="card-header">
        <div>
          <h1>Operacion de publicaciones</h1>
          <p className="muted">
            Gestiona el CRUD, exporta a Excel, ejecuta triggers y aplica filtros con los permisos de tu usuario.
          </p>
        </div>
        <div className="badge-list">
          <span className="badge">{user?.role_name || user?.role_code || "sin rol"}</span>
          <span className="badge secondary">{totalPublications} publicaciones</span>
        </div>
      </header>

      <section className="filters-card">
        <form className="filter-grid" onSubmit={applyFilters}>
          <label>
            Buscar
            <input
              type="text"
              name="search"
              value={filterDraft.search}
              onChange={handleFilterChange}
              placeholder="Contenido..."
            />
          </label>
          <label>
            Desde
            <input
              type="date"
              name="startDate"
              value={filterDraft.startDate}
              onChange={handleFilterChange}
            />
          </label>
          <label>
            Hasta
            <input
              type="date"
              name="endDate"
              value={filterDraft.endDate}
              onChange={handleFilterChange}
            />
          </label>
          <label>
            Likes mínimos
            <input
              type="number"
              name="minLikes"
              min="0"
              value={filterDraft.minLikes}
              onChange={handleFilterChange}
            />
          </label>
          <label>
            Likes máximos
            <input
              type="number"
              name="maxLikes"
              min="0"
              value={filterDraft.maxLikes}
              onChange={handleFilterChange}
            />
          </label>
          <div className="filter-actions">
            <button type="submit" className="primary" disabled={loading}>
              Aplicar filtros
            </button>
            <button type="button" className="ghost" onClick={resetFilters} disabled={loading}>
              Limpiar
            </button>
          </div>
        </form>
      </section>

      <section className="toolbar">
        <div className="toolbar-buttons">
          <button type="button" className="primary" onClick={openCreateForm} disabled={loading}>
            Nueva publicación
          </button>
          <button type="button" className="ghost" onClick={configureTrigger} disabled={loading}>
            Configurar trigger
          </button>
        </div>
        <button type="button" className="accent" onClick={exportToExcel} disabled={loading}>
          Exportar a Excel
        </button>
      </section>

      {error ? <div className="error-banner">{error}</div> : null}
      {status ? <div className="success-banner">{status}</div> : null}

      <div className="table-wrapper">
        {loading ? (
          <div className="muted">Cargando publicaciones...</div>
        ) : publications.length === 0 ? (
          <div className="muted">No se encontraron publicaciones con los filtros seleccionados.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Contenido</th>
                <th>Imagen</th>
                <th>Likes</th>
                <th>Comentarios</th>
                <th>Compartidos</th>
                <th>Creado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {publications.map((publication) => (
                <tr key={publication.publication_id}>
                  <td>{publication.publication_id}</td>
                  <td className="cell-content">{publication.content || "(sin contenido)"}</td>
                  <td>
                    {publication.image_url ? (
                      <a href={publication.image_url} target="_blank" rel="noreferrer" className="link">
                        Ver imagen
                      </a>
                    ) : (
                      <span className="muted">Sin imagen</span>
                    )}
                  </td>
                  <td>{publication.total_likes}</td>
                  <td>{publication.total_comments}</td>
                  <td>{publication.total_shares}</td>
                  <td>{formatDate(publication.created_at)}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => openEditForm(publication)}
                        disabled={!hasPermission("canUpdate")}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => deletePublication(publication.publication_id)}
                        disabled={!hasPermission("canDelete")}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {formOpen ? (
        <form className="form-grid publication-form" onSubmit={submitForm}>
          <h2>{editingId ? "Editar publicación" : "Nueva publicación"}</h2>
          <label className="wide">
            Contenido
            <textarea
              name="content"
              value={formData.content}
              onChange={handleFormChange}
              placeholder="Describe la publicación"
              rows={3}
              required
            />
          </label>
          <label className="wide">
            URL de la imagen
            <input
              type="url"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleFormChange}
              placeholder="https://..."
            />
          </label>
          <div className="form-row">
            <label>
              Likes
              <input
                type="number"
                name="totalLikes"
                min="0"
                value={formData.totalLikes}
                onChange={handleFormChange}
              />
            </label>
            <label>
              Comentarios
              <input
                type="number"
                name="totalComments"
                min="0"
                value={formData.totalComments}
                onChange={handleFormChange}
              />
            </label>
            <label>
              Compartidos
              <input
                type="number"
                name="totalShares"
                min="0"
                value={formData.totalShares}
                onChange={handleFormChange}
              />
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" className="primary" disabled={loading}>
              {editingId ? "Guardar cambios" : "Crear publicación"}
            </button>
            <button type="button" className="ghost" onClick={closeForm}>
              Cancelar
            </button>
          </div>
        </form>
      ) : null}
      </section>
    </section>
  );
}

export default PublicationsManager;
