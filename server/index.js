import express from 'express';
import cors from 'cors';
import { requireAuth } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import boardRoutes from './routes/boards.js';
import cardRoutes from './routes/cards.js';
import aiRoutes from './routes/ai.js';
import joinRoutes from './routes/join.js';

const app = express();
const configuredOrigins = (process.env.CLIENT_ORIGIN || '').split(',').map((value) => {
  try { return new URL(value.trim()).origin; } catch { return null; }
}).filter(Boolean);
if (process.env.NODE_ENV === 'production') {
  const missing = [
    ['SUPABASE_URL', process.env.SUPABASE_URL],
    ['SUPABASE_PUBLISHABLE_KEY', process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY],
    ['WEB_APP_URL', process.env.WEB_APP_URL],
    ['CLIENT_ORIGIN', process.env.CLIENT_ORIGIN]
  ].filter(([, value]) => !value?.trim()).map(([name]) => name);
  if (missing.length) throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
}
app.use(cors({
  origin(origin, callback) {
    // Local Vite access commonly uses a LAN IP instead of localhost.
    const localDev = process.env.NODE_ENV !== 'production' && origin && /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+):5173$/.test(origin);
    callback(null, !origin || localDev || configuredOrigins.includes(origin));
  },
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api', requireAuth);
app.use('/api/boards', boardRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/boards', aiRoutes);
app.use('/api', joinRoutes);
app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: 'Something went wrong.' }); });
const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Boardroom API listening on ${port}`));
