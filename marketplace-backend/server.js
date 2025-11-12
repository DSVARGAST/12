// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ExcelJS = require('exceljs');
const connectDB = require('./config/db');

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));

let db;

// ===== CONFIGURACIONES BASE =====
const JWT_SECRET = process.env.JWT_SECRET || 'insecure-development-secret';
const ENCRYPTION_SECRET = process.env.ENCRYPTION_KEY || 'change-me-in-production';
const ENCRYPTION_KEY = crypto.createHash('sha256').update(String(ENCRYPTION_SECRET)).digest();

// ===== FUNCIONES AUXILIARES =====
function encryptText(text) {
  if (text === null || text === undefined) return null;
  if (text === '') return '';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-ctr', ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

function decryptText(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return value;
  if (!value.includes(':')) return value;
  const [ivHex, encryptedHex] = value.split(':');
  if (!ivHex || !encryptedHex) return value;
  try {
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-ctr', ENCRYPTION_KEY, iv);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    return value;
  }
}

function mapPublicationRow(row) {
  return {
    publication_id: row.publication_id,
    content: decryptText(row.content),
    image_url: decryptText(row.image_url),
    total_likes: row.total_likes,
    total_comments: row.total_comments,
    total_shares: row.total_shares,
    created_at: row.created_at,
  };
}

// ===== AUTENTICACIÓN =====
function authenticate(requiredPermissions = []) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
    if (!token) return res.status(401).json({ message: 'No autorizado' });

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch {
      return res.status(401).json({ message: 'Token inválido o expirado' });
    }

    const missing = requiredPermissions.filter(p => !req.user?.permissions?.[p]);
    if (missing.length > 0) return res.status(403).json({ message: 'Permisos insuficientes', missing });
    next();
  };
}

// ===== HEALTH CHECK =====
app.get('/health', async (_req, res) => {
  try {
    if (!db) throw new Error('db not ready');
    await db.query('SELECT 1');
    return res.json({ ok: true, db: 'ok' });
  } catch (e) {
    return res.status(200).json({ ok: true, db: 'error', msg: e.message });
  }
});

// ===== LOGIN =====
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Faltan credenciales' });
  try {
    const [rows] = await db.execute(
      `SELECT u.*, r.code AS role_code, r.name AS role_name,
              r.can_create, r.can_update, r.can_delete, r.can_export, r.can_manage_triggers
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE email = ? AND is_active = 1 LIMIT 1`,
      [email]
    );
    if (!rows.length) return res.status(401).json({ message: 'Credenciales inválidas' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Credenciales inválidas' });

    const safeUser = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role_id: user.role_id,
      role_code: user.role_code,
      role_name: user.role_name,
      permissions: {
        canCreate: !!user.can_create,
        canUpdate: !!user.can_update,
        canDelete: !!user.can_delete,
        canExport: !!user.can_export,
        canManageTriggers: !!user.can_manage_triggers,
      },
    };
    const token = jwt.sign(safeUser, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: safeUser });
  } catch (e) {
    console.error('Error login:', e.message);
    res.status(500).json({ message: 'Error interno' });
  }
});

app.get('/api/auth/profile', authenticate(), (req, res) => res.json({ user: req.user }));

// ====== PUBLICATIONS ======

// Logger para verificar rutas
app.use((req, _res, next) => {
  if (req.path.startsWith('/api/publications')) console.log('>>', req.method, req.path);
  next();
});


app.get('/api/publications/export', authenticate(['canExport']), async (req, res) => {

  try {
    const [rows] = await db.execute(`
      SELECT publication_id, content, image_url, total_likes, total_comments, total_shares, created_at
      FROM publications ORDER BY created_at DESC
    `);
    const publications = rows.map(mapPublicationRow);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Publicaciones');
    sheet.columns = [
      { header: 'ID', key: 'publication_id', width: 10 },
      { header: 'Contenido', key: 'content', width: 50 },
      { header: 'Imagen', key: 'image_url', width: 40 },
      { header: 'Likes', key: 'total_likes', width: 10 },
      { header: 'Comentarios', key: 'total_comments', width: 15 },
      { header: 'Compartidos', key: 'total_shares', width: 15 },
      { header: 'Creado', key: 'created_at', width: 25 },
    ];
    publications.forEach(row => sheet.addRow(row));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="publicaciones.xlsx"');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Error al exportar:', err.message);
    res.status(500).json({ message: 'Error interno al exportar.' });
  }
});

// LISTAR PUBLICACIONES
app.get('/api/publications', authenticate(), async (_req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM publications ORDER BY created_at DESC');
    res.json(rows.map(mapPublicationRow));
  } catch (err) {
    res.status(500).json({ message: 'Error al listar publicaciones' });
  }
});

// DETALLE PUBLICACIÓN
app.get('/api/publications/:id', authenticate(), async (req, res) => {
  const { id } = req.params;
  const [rows] = await db.execute('SELECT * FROM publications WHERE publication_id = ?', [id]);
  if (!rows.length) return res.status(404).json({ message: 'Publicación no encontrada' });
  res.json(mapPublicationRow(rows[0]));
});

// ===== INICIO SERVIDOR =====
const PORT = process.env.PORT || 5000;
(async () => {
  try {
    db = await connectDB();
    app.listen(PORT, () => console.log(`✅ Servidor corriendo en http://localhost:${PORT}`));
  } catch (e) {
    console.error('❌ Fallo crítico:', e.message);
    process.exit(1);
  }
})();
