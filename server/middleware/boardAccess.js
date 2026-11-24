const roleRank = Object.freeze({ viewer: 0, member: 1, owner: 2 });

export function boardAccess(minRole = 'viewer', getBoardId = (req) => req.params.boardId) {
  if (!Object.hasOwn(roleRank, minRole)) throw new TypeError(`Invalid minimum role: ${minRole}`);
  return async (req, res, next) => {
    try {
      const boardId = await getBoardId(req);
      if (!boardId) return res.status(404).json({ error: 'Board or resource not found.' });
      const { data, error } = await req.supabase.from('user_boards').select('role').eq('board_id', boardId).eq('user_id', req.user.id).maybeSingle();
      if (error) return res.status(500).json({ error: 'Could not check board access.' });
      const role = data?.role;
      if (!Object.hasOwn(roleRank, role) || roleRank[role] < roleRank[minRole]) return res.status(403).json({ error: 'You do not have permission to do that.' });
      req.role = role;
      req.boardId = boardId;
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

export async function boardForCard(cardId, db) {
  const { data, error } = await db.from('cards').select('board_id').eq('id', cardId).maybeSingle();
  if (error || !data) return null;
  return data.board_id;
}
