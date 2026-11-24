import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';

const columns = [
  { id: 'todo', title: 'To do' },
  { id: 'in_progress', title: 'In progress' },
  { id: 'done', title: 'Done' }
];
export function useBoard(boardId) {
  const [board, setBoard] = useState(null); const [lists, setLists] = useState([]); const [role, setRole] = useState('viewer'); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const nextBoard = await api(`/boards/${boardId}`);
      setBoard(nextBoard); setRole(nextBoard.role);
      setLists(columns.map((column) => ({ ...column, cards: nextBoard.cards.filter((card) => card.status === column.id).map((card) => ({ ...card, list_id: column.id })) })));
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [boardId]);
  useEffect(() => { refresh(); }, [refresh]);
  return { board, lists, setLists, role, loading, error, refresh };
}
