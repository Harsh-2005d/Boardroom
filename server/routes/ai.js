import { Router } from 'express';
import { boardAccess } from '../middleware/boardAccess.js';

const router = Router();
router.post('/:boardId/summary', boardAccess('viewer'), async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return res.status(503).json({ error: 'AI summaries are not configured. Set GEMINI_API_KEY on the API server and restart it.' });
  const { data: cards, error } = await req.supabase.from('cards').select('title,status').eq('board_id', req.boardId).order('position');
  if (error) return res.status(400).json({ error: error.message });
  const content = ['todo', 'in_progress', 'done'].map((status) => `${status}: ${(cards || []).filter((card) => card.status === status).map((card) => JSON.stringify(card.title)).join(', ') || '(none)'}`).join('\n');
  const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({ contents: [{ parts: [{ text: `You summarize a Kanban board. Use only the card titles and statuses below. Briefly describe progress, completed work, and plausible blockers. Clearly label blockers as possibilities inferred from titles.\n\n${content}` }] }] })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const providerMessage = result.error?.message || `Gemini API returned HTTP ${response.status}`;
      console.error('Gemini summary failed:', response.status, providerMessage);
      if (response.status === 401 || response.status === 403) return res.status(502).json({ error: 'Gemini rejected this API key or the key lacks Gemini API access. Check GEMINI_API_KEY on the API server.' });
      if (response.status === 429) return res.status(502).json({ error: 'Gemini rate limit reached. Check the project quota and try again later.' });
      return res.status(502).json({ error: `Gemini request failed: ${providerMessage}` });
    }
    const summary = result.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
    if (!summary) return res.status(502).json({ error: 'Gemini returned an empty summary. Try again.' });
    res.json({ summary });
  } catch (error) {
    console.error('Gemini summary failed:', error?.status || error?.code || '', error?.message || error);
    res.status(502).json({ error: 'Could not reach Gemini. Check the API server network connection.' });
  }
});
export default router;
