require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ExcelJS = require('exceljs');
const connectDB = require('./config/db');
const { buildSafeUser } = require('./utils/auth');
const { buildPublicationQuery, filterPublicationsBySearch } = require('./utils/publications');

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));

let db;

const JWT_SECRET = process.env.JWT_SECRET || 'insecure-development-secret';
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

function decryptText(value) {
  if (!value || typeof value !== 'string' || !value.includes(':')) return value;
  try {
    const [ivHex, encHex] = value.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const enc = Buffer.from(encHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-ctr', ENCRYPTION_KEY, iv);
    const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
    return dec.toString('utf8');
  } catch {
    return value;
  }
}

const mapPub = (row) => ({
  publication_id: row.publication_id,
  content: decryptText(row.content),
  image_url: row.image_url ? decryptText(row.image_url) : null,
  total_likes: row.total_likes,
  total_comments: row.total_comments,
  total_shares: row.total_shares,
  created_at: row.created_at,
});

function auth(required = []) {
  return (req, res, next) => {
    const token = (req.headers.authorization || '').replace(/^Bearer /, '');
    if (!token) return res.status(401).json({ message: 'No autorizado' });

    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ message: 'Token invalido o expirado' });
    }

    const missing = required.filter((permission) => !req.user?.permissions?.[permission]);
    if (missing.length) {
      return res.status(403).json({ message: 'Permisos insuficientes', missing });
    }

    next();
  };
}

app.get('/health', async (_req, res) => {
  try {
    await db.query('SELECT 1');
    return res.json({ ok: true, db: 'ok' });
  } catch (error) {
    return res.json({ ok: true, db: 'error', msg: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Faltan credenciales' });
  }

  try {
    const [rows] = await db.execute(
      `SELECT user_id, email, full_name, password, status
       FROM users
       WHERE email = ? AND status = 'active'
       LIMIT 1`,
      [email]
    );

    if (!rows.length) {
      return res.status(401).json({ message: 'Credenciales invalidas' });
    }

    const user = rows[0];
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Credenciales invalidas' });
    }

    const safeUser = buildSafeUser(user);

    const token = jwt.sign(safeUser, JWT_SECRET, { expiresIn: '1h' });
    return res.json({ token, user: safeUser });
  } catch (error) {
    return res.status(500).json({ message: 'Error interno' });
  }
});

app.get('/api/auth/profile', auth(), (req, res) => res.json({ user: req.user }));

app.get('/api/users', auth(), async (_req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT user_id, email, full_name, status, registration_date
       FROM users
       ORDER BY full_name ASC`
    );

    return res.json(
      rows.map((user) => ({
        id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        status: user.status,
        registration_date: user.registration_date,
      }))
    );
  } catch (error) {
    return res.status(500).json({ message: 'Error al listar usuarios' });
  }
});

app.use((req, _res, next) => {
  if (req.path.startsWith('/api/publications')) {
    console.log('>>', req.method, req.path, req.query);
  }
  next();
});

app.get('/api/publications', auth(), async (req, res) => {
  const { search } = req.query || {};
  const { sql, params } = buildPublicationQuery(req.query || {});

  try {
    const [rows] = await db.execute(sql, params);
    const publications = filterPublicationsBySearch(rows.map(mapPub), search);

    return res.json(publications);
  } catch (error) {
    return res.status(500).json({ message: 'Error al listar publicaciones' });
  }
});

app.post('/api/publications', auth(['canCreate']), async (req, res) => {
  const { content, imageUrl, totalLikes = 0, totalComments = 0, totalShares = 0 } = req.body || {};
  if (!content || !String(content).trim()) {
    return res.status(400).json({ message: 'Contenido requerido' });
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO publications (
        user_id, content, image_url, scheduled_date, published_date, status, automation_enabled,
        total_likes, total_comments, total_shares, created_at, updated_at
      )
      VALUES (?, ?, ?, NOW(), NULL, 'scheduled', 0, ?, ?, ?, NOW(), NOW())`,
      [
        req.user.id,
        encryptText(String(content).trim()),
        imageUrl ? encryptText(String(imageUrl).trim()) : null,
        Number(totalLikes) || 0,
        Number(totalComments) || 0,
        Number(totalShares) || 0,
      ]
    );

    const [rows] = await db.execute(
      'SELECT publication_id, content, image_url, total_likes, total_comments, total_shares, created_at FROM publications WHERE publication_id = ?',
      [result.insertId]
    );

    return res.status(201).json(mapPub(rows[0]));
  } catch (error) {
    return res.status(500).json({ message: 'Error al crear publicacion' });
  }
});

app.put('/api/publications/:id', auth(['canUpdate']), async (req, res) => {
  const { id } = req.params;
  const { content, imageUrl, totalLikes = 0, totalComments = 0, totalShares = 0 } = req.body || {};

  try {
    const [existing] = await db.execute('SELECT 1 FROM publications WHERE publication_id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json({ message: 'Publicacion no encontrada' });
    }

    await db.execute(
      `UPDATE publications
       SET content = ?, image_url = ?, total_likes = ?, total_comments = ?, total_shares = ?, updated_at = NOW()
       WHERE publication_id = ?`,
      [
        encryptText(String(content || '')),
        imageUrl ? encryptText(String(imageUrl).trim()) : null,
        Number(totalLikes) || 0,
        Number(totalComments) || 0,
        Number(totalShares) || 0,
        id,
      ]
    );

    const [rows] = await db.execute(
      'SELECT publication_id, content, image_url, total_likes, total_comments, total_shares, created_at FROM publications WHERE publication_id = ?',
      [id]
    );

    return res.json(mapPub(rows[0]));
  } catch (error) {
    return res.status(500).json({ message: 'Error al actualizar publicacion' });
  }
});

app.delete('/api/publications/:id', auth(['canDelete']), async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.execute('DELETE FROM publications WHERE publication_id = ?', [id]);
    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Publicacion no encontrada' });
    }

    return res.status(204).end();
  } catch (error) {
    return res.status(500).json({ message: 'Error al eliminar publicacion' });
  }
});

app.get('/api/publications/export', auth(['canExport']), async (req, res) => {
  const { search } = req.query || {};
  const { sql, params } = buildPublicationQuery(req.query || {});

  try {
    const [rows] = await db.execute(sql, params);
    const data = filterPublicationsBySearch(rows.map(mapPub), search);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Publicaciones');

    sheet.columns = [
      { header: 'ID', key: 'publication_id', width: 8 },
      { header: 'Contenido', key: 'content', width: 60 },
      { header: 'Imagen', key: 'image_url', width: 40 },
      { header: 'Likes', key: 'total_likes', width: 10 },
      { header: 'Comentarios', key: 'total_comments', width: 14 },
      { header: 'Compartidos', key: 'total_shares', width: 14 },
      { header: 'Creado', key: 'created_at', width: 22 },
    ];

    data.forEach((row) => sheet.addRow(row));

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="publicaciones.xlsx"'
    );
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    await workbook.xlsx.write(res);
    return res.end();
  } catch (error) {
    console.error('Error al exportar:', error.message);
    return res.status(500).json({ message: 'Error interno al exportar.' });
  }
});

app.post('/api/triggers/publication-log', auth(['canManageTriggers']), async (_req, res) => {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS publications_log (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        publication_id BIGINT UNSIGNED,
        action VARCHAR(20) NOT NULL,
        at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const createTrigger = `
      CREATE TRIGGER trg_publications_insert AFTER INSERT ON publications
      FOR EACH ROW INSERT INTO publications_log (publication_id, action) VALUES (NEW.publication_id, 'insert')
    `;

    await db.execute(createTrigger).catch(() => {});
    return res.json({ message: 'Trigger configurado (o ya existente).' });
  } catch (error) {
    return res.status(500).json({ message: 'No se pudo configurar el trigger.' });
  }
});

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    db = await connectDB();
    app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
  } catch (error) {
    console.error('Fallo critico:', error.message);
    process.exit(1);
  }
})();
