import { Router } from 'express';
import { boardAccess } from '../middleware/boardAccess.js';
import { createJoinToken, hashJoinToken, validJoinMode } from '../lib/joinLinks.js';

const router = Router();
router.post('/boards/:boardId/join-links', boardAccess('owner'), async (req, res) => {
  const mode = req.body?.mode;
  if (!validJoinMode(mode)) return res.status(400).json({ error: 'Choose anyone or approval.' });
  const token = createJoinToken();
  const { data, error } = await req.supabase.from('board_join_links').insert({ board_id: req.boardId, token_hash: hashJoinToken(token), mode, created_by: req.user.id }).select('id,mode,created_at').single();
  if (error) return res.status(400).json({ error: error.message });
  const origin = (process.env.WEB_APP_URL || (process.env.NODE_ENV !== 'production' ? 'http://localhost:5173' : '')).replace(/\/$/, '');
  if (!origin) return res.status(500).json({ error: 'WEB_APP_URL is not configured on the API server.' });
  res.status(201).json({ ...data, url: `${origin}/join/${token}` });
});
router.get('/boards/:boardId/join-links', boardAccess('owner'), async (req, res) => {
  const { data, error } = await req.supabase.from('board_join_links').select('id,mode,created_at,revoked_at').eq('board_id', req.boardId).order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data || []);
});
router.delete('/join-links/:linkId', async (req, res) => {
  const { data: link } = await req.supabase.from('board_join_links').select('board_id').eq('id', req.params.linkId).maybeSingle();
  if (!link) return res.status(404).json({ error: 'Join link not found.' });
  const { data: membership } = await req.supabase.from('user_boards').select('role').eq('board_id', link.board_id).eq('user_id', req.user.id).maybeSingle();
  if (membership?.role !== 'owner') return res.status(403).json({ error: 'Only board owners can revoke links.' });
  const { error } = await req.supabase.from('board_join_links').update({ revoked_at: new Date().toISOString() }).eq('id', req.params.linkId);
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).end();
});
router.post('/join/:token', async (req, res) => {
  const { data, error } = await req.supabase.rpc('use_board_join_link', { link_token_hash: hashJoinToken(req.params.token) });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});
router.get('/boards/:boardId/join-requests', boardAccess('owner'), async (req, res) => {
  const { data, error } = await req.supabase.rpc('board_join_request_details', { target_board: req.boardId });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data || []);
});
router.post('/join-requests/:requestId/review', async (req, res) => {
  const decision = req.body?.decision;
  if (!['approved','rejected'].includes(decision)) return res.status(400).json({ error: 'Choose approved or rejected.' });
  const { error } = await req.supabase.rpc('review_board_join_request', { request_id: req.params.requestId, decision });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ status: decision });
});
export default router;
