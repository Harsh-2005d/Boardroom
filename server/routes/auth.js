import { Router } from 'express';
import { supabase } from '../db/supabase.js';

const router = Router();
router.post('/register', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password || password.length < 8) return res.status(400).json({ error: 'Enter an email and a password with at least 8 characters.' });
  const appURL = process.env.WEB_APP_URL || (process.env.NODE_ENV !== 'production' ? 'http://localhost:5173' : '');
  const allowedOrigins = (process.env.CLIENT_ORIGIN || appURL).split(',').map((origin) => {
    try { return new URL(origin.trim()).origin; } catch { return null; }
  }).filter(Boolean);
  const requestedURL = String(process.env.EMAIL_REDIRECT_URL || req.body?.emailRedirectTo || `${appURL}/login`);
  let redirectOrigin;
  try { redirectOrigin = new URL(requestedURL).origin; } catch { return res.status(400).json({ error: 'Email redirect URL is invalid. Configure WEB_APP_URL on the API server.' }); }
  const localDevOrigin = /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+):5173$/.test(redirectOrigin);
  if (!allowedOrigins.includes(redirectOrigin) && !(process.env.NODE_ENV !== 'production' && localDevOrigin)) return res.status(400).json({ error: 'Email redirect origin is not in CLIENT_ORIGIN.' });
  const redirectTo = `${redirectOrigin}/login`;
  const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } });
  if (error) return res.status(error.status === 429 ? 429 : 400).json({ error: error.message });
  res.status(201).json({ user: data.user, session: data.session, message: data.session ? undefined : 'Check your email to confirm your account.' });
});
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(401).json({ error: error.message });
  res.json({ user: data.user, session: data.session });
});
export default router;
