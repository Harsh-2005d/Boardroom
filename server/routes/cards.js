import { Router } from 'express';
import { boardAccess, boardForCard } from '../middleware/boardAccess.js';

const router = Router();
const access = (role = 'member') => boardAccess(role, async (req) => {
  const id = await boardForCard(req.params.cardId, req.supabase);
  req.params.boardId = id;
  return id;
});

router.patch('/:cardId', access(), async (req, res) => {
  const updates = {};
  for (const key of ['title', 'description']) if (typeof req.body?.[key] === 'string') updates[key] = req.body[key].trim();
  if (Number.isFinite(req.body?.position)) updates.position = req.body.position;
  if (['todo', 'in_progress', 'done'].includes(req.body?.status)) updates.status = req.body.status;
  if (!Object.keys(updates).length || updates.title === '') return res.status(400).json({ error: 'Provide valid card fields.' });
  const { data, error } = await req.supabase.from('cards').update(updates).eq('id', req.params.cardId).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});
router.delete('/:cardId', access(), async (req, res) => {
  const { error } = await req.supabase.from('cards').delete().eq('id', req.params.cardId);
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).end();
});
export default router;
