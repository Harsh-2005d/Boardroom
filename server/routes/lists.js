import { Router } from 'express';
import { boardAccess, boardForList } from '../middleware/boardAccess.js';

const router = Router();
const access = (role) => boardAccess(role, async (req) => { const id = await boardForList(req.params.listId, req.supabase); req.params.boardId = id; return id; });
router.patch('/:listId', access('member'), async (req, res) => {
  const updates = {};
  if (typeof req.body?.title === 'string') updates.title = req.body.title.trim();
  if (Number.isFinite(req.body?.position)) updates.position = req.body.position;
  if (!Object.keys(updates).length || updates.title === '') return res.status(400).json({ error: 'Provide a valid list title or position.' });
  const { data, error } = await req.supabase.from('lists').update(updates).eq('id', req.params.listId).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});
router.delete('/:listId', access('member'), async (req, res) => {
  const { error } = await req.supabase.from('lists').delete().eq('id', req.params.listId);
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).end();
});
router.get('/:listId/cards', async (req, res) => {
  const boardId = await boardForList(req.params.listId, req.supabase);
  if (!boardId) return res.status(404).json({ error: 'List not found.' });
  req.params.boardId = boardId;
  return boardAccess('viewer')(req, res, async () => {
    const { data, error } = await req.supabase.from('cards').select('*').eq('list_id', req.params.listId).order('position');
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  });
});
router.post('/:listId/cards', access('member'), async (req, res) => {
  const title = String(req.body?.title || '').trim();
  if (!title) return res.status(400).json({ error: 'Card title is required.' });
  const { data: last } = await req.supabase.from('cards').select('position').eq('list_id', req.params.listId).order('position', { ascending: false }).limit(1).maybeSingle();
  const { data, error } = await req.supabase.from('cards').insert({ list_id: req.params.listId, title, description: '', position: (last?.position || 0) + 1000 }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});
export default router;
