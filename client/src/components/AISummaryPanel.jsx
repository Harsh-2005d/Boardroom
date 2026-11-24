import { useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { api } from '../api/client';

export default function AISummaryPanel({ boardId, onClose }) {
  const [summary, setSummary] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  async function loadSummary() { setLoading(true); setError(''); setSummary(''); try { const data = await api(`/boards/${boardId}/summary`, { method: 'POST' }); setSummary(data.summary); } catch (e) { setError(e.message); } finally { setLoading(false); } }
  useEffect(() => { loadSummary(); }, [boardId]);
  return <aside className="summary-panel"><div className="summary-heading"><div className="summary-title"><span className="ai-icon"><Sparkles size={17} /></span><div><span className="eyebrow">BOARD INTELLIGENCE</span><h3>AI summary</h3></div></div><button className="icon-button" onClick={onClose}><X size={17} /></button></div>
    {loading ? <div className="summary-loading"><span className="spinner" /> Reading your board…</div> : error ? <><p className="form-error">{error}</p><button className="button button-quiet" onClick={loadSummary}>Try again</button></> : <p className="summary-text">{summary}</p>}
    <p className="summary-footnote">Generated from the cards currently on this board.</p>
  </aside>;
}
