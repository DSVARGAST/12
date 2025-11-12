// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));

let db; // pool MySQL

// Health check
app.get('/health', async (_req, res) => {
  try {
    if (!db) throw new Error('db not ready');
    await db.query('SELECT 1');
    return res.json({ ok: true, db: 'ok' });
  } catch (e) {
    return res.status(200).json({ ok: true, db: 'error', msg: e.message });
  }
});

// Home
app.get('/', (_req, res) => {
  res.send('API de Marketplace está corriendo.');
});

// Productos (usa tu tabla real)
app.get('/api/products', async (_req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM products LIMIT 100');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener productos:', error.message);
    res.status(500).json({ message: 'Error interno del servidor al obtener productos.' });
  }
});

// Publications (tu frontend llama /publications, damos alias)
async function getPublications(req, res) {
  try {
    const [rows] = await db.execute(
      'SELECT publication_id, content, image_url, total_likes, total_comments, total_shares, created_at FROM publications ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener publicaciones:', error.message);
    res.status(500).json({ message: 'Error interno del servidor al obtener publicaciones.' });
  }
}
app.get('/api/publications', getPublications);
app.get('/publications', getPublications); // alias

const PORT = Number(process.env.PORT || 5000);
(async () => {
  try {
    db = await connectDB();
    app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
  } catch (e) {
    console.error('Fallo crítico al iniciar el servidor:', e.message);
    process.exit(1);
  }
})();
