import { supabase, userClient } from '../db/supabase.js';

export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return res.status(401).json({ error: 'Sign in to continue.' });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: 'Your session is invalid or expired.' });
  req.user = { id: data.user.id, email: data.user.email };
  req.accessToken = token;
  req.supabase = userClient(token);
  next();
}
