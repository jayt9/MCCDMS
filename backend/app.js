// ============================================================
// app.js — Express app setup (no server.listen here)
// The server is started in index.js.
// Keeping them separate makes the app testable.
// ============================================================

require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const { authMiddleware, requireRole } = require('./middleware/auth');

const familiesRouter = require('./routes/families');
const childrenRouter = require('./routes/children');
const adminRouter    = require('./routes/admin');
const meRouter       = require('./routes/me');

const app = express();

// ─── CORS ─────────────────────────────────────────────────────
// In production, lock this down to your Vercel frontend URL.
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
}));

app.use(express.json());

// ─── Public routes ────────────────────────────────────────────
// Login is handled by Supabase client in the frontend directly.
// Only one truly public endpoint: a health check for uptime monitoring.

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ─── Protected routes ─────────────────────────────────────────
// authMiddleware runs first on every protected route.

app.use('/families', authMiddleware, familiesRouter);
app.use('/children', authMiddleware, childrenRouter);
app.use('/admin',    authMiddleware, requireRole('admin'), adminRouter);
app.use('/me',       authMiddleware, meRouter);

// ─── 404 + global error handler ──────────────────────────────

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

app.use((err, req, res, next) => {
  console.error('[error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;