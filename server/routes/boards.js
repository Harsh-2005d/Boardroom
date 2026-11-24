import { Router } from 'express';
import { boardAccess } from '../middleware/boardAccess.js';

const router = Router();
router.get('/', async (req, res) => {
  const { data, error } = await req.supabase.from('user_boards').select('role, boards(id,title,created_at)').eq('user_id', req.user.id).order('created_at', { referencedTable: 'boards', ascending: false });
  if (error) { console.error('GET /api/boards failed:', error); return res.status(500).json({ error: error.message }); }
  res.json((data || []).map(({ role, boards }) => ({ ...boards, role })).filter((b) => b.id));
});
router.post('/', async (req, res) => {
  const title = String(req.body?.title || '').trim();
  if (!title) return res.status(400).json({ error: 'Board title is required.' });
  const { data, error } = await req.supabase.rpc('create_board_for_current_user', { board_title: title });
  if (error) { console.error('POST /api/boards failed:', error); return res.status(400).json({ error: error.message }); }
  res.status(201).json({ ...data, role: 'owner' });
});
router.delete('/:boardId', boardAccess('owner'), async (req, res) => {
  const { error } = await req.supabase.from('boards').delete().eq('id', req.boardId);
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).end();
});
router.get('/:boardId', boardAccess('viewer'), async (req, res) => {
  const { data, error } = await req.supabase.from('boards').select('id,title,owner_id,created_at').eq('id', req.boardId).single();
  if (error) return res.status(400).json({ error: error.message });
  const { data: cards, error: cardsError } = await req.supabase.from('cards').select('*').eq('board_id', req.boardId).order('position');
  if (cardsError) return res.status(400).json({ error: cardsError.message });
  const { data: members, error: membersError } = await req.supabase.rpc('board_member_emails', { target_board: req.boardId });
  if (membersError) return res.status(400).json({ error: membersError.message });
  res.json({ ...data, role: req.role, cards: cards || [], members: members || [] });
});
router.get('/:boardId/members', boardAccess('viewer'), async (req, res) => {
  const { data, error } = await req.supabase.rpc('board_member_emails', { target_board: req.boardId });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ role: req.role, members: data || [] });
});
router.patch('/:boardId/members/:userId', boardAccess('owner'), async (req, res) => {
  const role = req.body?.role;
  if (!['owner', 'member', 'viewer'].includes(role)) return res.status(400).json({ error: 'Choose owner, member, or viewer.' });
  const { error } = await req.supabase.rpc('set_board_member_role', { target_board: req.boardId, target_user: req.params.userId, new_role: role });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ user_id: req.params.userId, role });
});
router.delete('/:boardId/members/:userId', boardAccess('owner'), async (req, res) => {
  const { error } = await req.supabase.rpc('remove_board_member', { target_board: req.boardId, target_user: req.params.userId });
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).end();
});
router.post('/:boardId/invite', boardAccess('owner'), async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const role = req.body?.role;
  if (!email || !['member', 'viewer'].includes(role)) return res.status(400).json({ error: 'Provide an email and choose member or viewer.' });
  const { data, error } = await req.supabase.rpc('invite_board_member_by_email', { target_board: req.boardId, invite_email: email, member_role: role });
  if (error) return res.status(400).json({ error: error.message });
  if (!data?.length) return res.status(404).json({ error: 'That person needs to create an account before joining a board.' });
  res.status(201).json(data[0]);
});
router.get('/:boardId/cards', boardAccess('viewer'), async (req, res) => {
  const { data, error } = await req.supabase.from('cards').select('*').eq('board_id', req.boardId).order('position');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data || []);
});
router.post('/:boardId/cards', boardAccess('member'), async (req, res) => {
  const title = String(req.body?.title || '').trim();
  const status = ['todo','in_progress','done'].includes(req.body?.status) ? req.body.status : 'todo';
  if (!title) return res.status(400).json({ error: 'Card title is required.' });
  const { data: last } = await req.supabase.from('cards').select('position').eq('board_id', req.boardId).eq('status', status).order('position', { ascending: false }).limit(1).maybeSingle();
  const description = String(req.body?.description || '');
  const { data, error } = await req.supabase.from('cards').insert({ board_id: req.boardId, title, description, status, position: (last?.position || 0) + 1000 }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});
export default router;
