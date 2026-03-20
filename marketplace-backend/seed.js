require('dotenv').config();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');

const ENCRYPTION_SECRET = process.env.ENCRYPTION_KEY || 'change-me-in-production';
const ENCRYPTION_KEY = crypto.createHash('sha256').update(String(ENCRYPTION_SECRET)).digest();

function encryptText(text) {
  if (text === null || text === undefined) return null;
  if (text === '') return '';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-ctr', ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

async function seed() {
  const db = await connectDB();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      email VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) DEFAULT NULL,
      registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      status ENUM('active','inactive') DEFAULT 'active',
      PRIMARY KEY (user_id),
      UNIQUE KEY uq_users_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS publications (
      publication_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id INT UNSIGNED NOT NULL,
      content TEXT,
      image_url TEXT,
      scheduled_date DATETIME NOT NULL,
      published_date DATETIME DEFAULT NULL,
      status ENUM('scheduled','published','failed') DEFAULT 'scheduled',
      automation_enabled TINYINT(1) DEFAULT 0,
      total_likes INT UNSIGNED DEFAULT 0,
      total_comments INT UNSIGNED DEFAULT 0,
      total_shares INT UNSIGNED DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (publication_id),
      KEY idx_publications_user_id (user_id),
      CONSTRAINT fk_publications_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `).catch(async (error) => {
    if (!String(error.message || '').includes('Duplicate foreign key constraint name')) {
      throw error;
    }
  });

  await db.execute(`
    CREATE TABLE IF NOT EXISTS publications_log (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      publication_id BIGINT UNSIGNED,
      action VARCHAR(20) NOT NULL,
      at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  await db.execute('DELETE FROM publications_log');
  await db.execute('DELETE FROM publications');
  await db.execute('DELETE FROM users');
  await db.execute('ALTER TABLE publications AUTO_INCREMENT = 1');
  await db.execute('ALTER TABLE users AUTO_INCREMENT = 1');

  const users = [
    { email: 'admin@docedigital.test', password: 'editor123', fullName: 'Administrador DOCE', status: 'active' },
    { email: 'cm@docedigital.test', password: 'editor123', fullName: 'Camila Rojas', status: 'active' },
    { email: 'analitica@docedigital.test', password: 'editor123', fullName: 'Mateo Salazar', status: 'active' },
    { email: 'soporte@docedigital.test', password: 'editor123', fullName: 'Laura Mendoza', status: 'active' },
  ];

  const insertedUsers = [];
  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    const [result] = await db.execute(
      'INSERT INTO users (email, password, full_name, status) VALUES (?, ?, ?, ?)',
      [user.email, passwordHash, user.fullName, user.status]
    );
    insertedUsers.push({ id: result.insertId, ...user });
  }

  const userByEmail = Object.fromEntries(insertedUsers.map((user) => [user.email, user.id]));
  const publications = [
    {
      email: 'admin@docedigital.test',
      content: 'Lanzamos la nueva linea visual de DOCE con enfoque en conversion y claridad para el cliente final.',
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
      status: 'published',
      automation: 1,
      likes: 184,
      comments: 26,
      shares: 12,
      createdAt: '2026-03-10 09:00:00',
    },
    {
      email: 'cm@docedigital.test',
      content: 'Calendario editorial listo para abril: contenido educativo, testimonios y piezas de campana comercial.',
      imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80',
      status: 'scheduled',
      automation: 1,
      likes: 73,
      comments: 11,
      shares: 5,
      createdAt: '2026-03-12 14:30:00',
    },
    {
      email: 'analitica@docedigital.test',
      content: 'El engagement en Instagram subio 18 por ciento esta semana. Las historias superaron el rendimiento esperado.',
      imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80',
      status: 'published',
      automation: 0,
      likes: 245,
      comments: 33,
      shares: 19,
      createdAt: '2026-03-14 08:15:00',
    },
    {
      email: 'soporte@docedigital.test',
      content: 'Respondimos preguntas frecuentes sobre tiempos de entrega y politicas de soporte en nuestros canales sociales.',
      imageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80',
      status: 'published',
      automation: 0,
      likes: 96,
      comments: 41,
      shares: 7,
      createdAt: '2026-03-15 16:45:00',
    },
    {
      email: 'admin@docedigital.test',
      content: 'Caso de exito: una estrategia simple de contenido consistente puede mejorar la confianza antes de vender.',
      imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80',
      status: 'published',
      automation: 1,
      likes: 312,
      comments: 54,
      shares: 28,
      createdAt: '2026-03-17 11:20:00',
    },
    {
      email: 'cm@docedigital.test',
      content: 'En preparacion una campana segmentada para clientes locales con piezas adaptadas por horario y formato.',
      imageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=900&q=80',
      status: 'scheduled',
      automation: 1,
      likes: 41,
      comments: 6,
      shares: 3,
      createdAt: '2026-03-18 10:05:00',
    },
    {
      email: 'analitica@docedigital.test',
      content: 'Reporte rapido: Facebook mantiene alcance estable, pero LinkedIn muestra mejor calidad de interaccion.',
      imageUrl: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80',
      status: 'published',
      automation: 0,
      likes: 129,
      comments: 17,
      shares: 14,
      createdAt: '2026-03-19 07:40:00',
    },
    {
      email: 'admin@docedigital.test',
      content: 'Publicacion de bienvenida para nuevos clientes con acceso a auditoria inicial y acompanamiento estrategico.',
      imageUrl: 'https://images.unsplash.com/photo-1497493292307-31c376b6e479?auto=format&fit=crop&w=900&q=80',
      status: 'published',
      automation: 1,
      likes: 208,
      comments: 24,
      shares: 16,
      createdAt: '2026-03-20 08:55:00',
    },
  ];

  for (const publication of publications) {
    const userId = userByEmail[publication.email];
    await db.execute(
      `INSERT INTO publications (
        user_id, content, image_url, scheduled_date, published_date, status, automation_enabled,
        total_likes, total_comments, total_shares, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        encryptText(publication.content),
        encryptText(publication.imageUrl),
        publication.createdAt,
        publication.status === 'published' ? publication.createdAt : null,
        publication.status,
        publication.automation,
        publication.likes,
        publication.comments,
        publication.shares,
        publication.createdAt,
        publication.createdAt,
      ]
    );
  }

  await db.end();
  console.log(`Seed completado: ${users.length} usuarios y ${publications.length} publicaciones.`);
}

seed().catch((error) => {
  console.error('Fallo al sembrar la base:', error.message);
  process.exit(1);
});
