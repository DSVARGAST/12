import card1 from "../img/card1.jpg";
import card2 from "../img/card2.jpg";
import card3 from "../img/card3.jpg";
import card4 from "../img/card4.jpg";
import card5 from "../img/card5.jpg";
import card6 from "../img/card6.jpg";

const defaultPermissions = {
  canCreate: true,
  canUpdate: true,
  canDelete: true,
  canExport: true,
  canManageTriggers: true,
};

const baseUsers = [
  {
    user_id: 1,
    full_name: "Daniela Vargas",
    email: "daniela@docedigital.co",
    role_name: "Directora de marca",
    permissions: defaultPermissions,
  },
  {
    user_id: 2,
    full_name: "Juan Camilo Ruiz",
    email: "juan@docedigital.co",
    role_name: "Social media manager",
    permissions: defaultPermissions,
  },
  {
    user_id: 3,
    full_name: "Marcela Torres",
    email: "marcela@docedigital.co",
    role_name: "Analista de contenidos",
    permissions: defaultPermissions,
  },
  {
    user_id: 4,
    full_name: "Valentina Gomez",
    email: "valentina@docedigital.co",
    role_name: "Community lead",
    permissions: defaultPermissions,
  },
];

const basePublications = [
  {
    publication_id: 101,
    content: "Lanzamos la agenda de abril con contenidos pensados para conversion y recordacion de marca.",
    image_url: card1,
    total_likes: 1840,
    total_comments: 138,
    total_shares: 62,
    created_at: "2026-03-28T09:15:00",
    platform: "Instagram",
  },
  {
    publication_id: 102,
    content: "Nueva campaña de temporada: piezas cortas, mensajes claros y una oferta central para captar leads.",
    image_url: card2,
    total_likes: 1290,
    total_comments: 96,
    total_shares: 41,
    created_at: "2026-03-29T12:40:00",
    platform: "Facebook",
  },
  {
    publication_id: 103,
    content: "Probamos un formato de carrusel con tips rápidos para mejorar presencia digital en equipos pequeños.",
    image_url: card3,
    total_likes: 980,
    total_comments: 84,
    total_shares: 36,
    created_at: "2026-03-30T08:25:00",
    platform: "LinkedIn",
  },
  {
    publication_id: 104,
    content: "Microvideo de producto con CTA simple y seguimiento en historias para reforzar interaccion.",
    image_url: card4,
    total_likes: 2145,
    total_comments: 173,
    total_shares: 88,
    created_at: "2026-03-31T18:05:00",
    platform: "Instagram",
  },
  {
    publication_id: 105,
    content: "Resumen semanal del equipo con aprendizajes, piezas destacadas y proximos hitos de publicacion.",
    image_url: card5,
    total_likes: 1160,
    total_comments: 92,
    total_shares: 33,
    created_at: "2026-04-01T10:10:00",
    platform: "Twitter",
  },
  {
    publication_id: 106,
    content: "Caso de exito del mes con foco en alcance, comentarios de la audiencia y conversion a contacto.",
    image_url: card6,
    total_likes: 1675,
    total_comments: 121,
    total_shares: 57,
    created_at: "2026-04-02T15:20:00",
    platform: "LinkedIn",
  },
];

function clonePermissions(permissions = defaultPermissions) {
  return { ...permissions };
}

export function getDemoUsers() {
  return baseUsers.map((user) => ({
    ...user,
    permissions: clonePermissions(user.permissions),
  }));
}

export function getDemoPublications() {
  return basePublications.map((publication) => ({ ...publication }));
}

export function createDemoSessionUser(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const match = getDemoUsers().find((user) => user.email.toLowerCase() === normalizedEmail);

  if (match) return match;

  return {
    user_id: 999,
    full_name: "Usuario Demo",
    email: normalizedEmail || "demo@docedigital.co",
    role_name: "Workspace demo",
    permissions: clonePermissions(),
  };
}
