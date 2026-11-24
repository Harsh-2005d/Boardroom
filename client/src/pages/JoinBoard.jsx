import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Link2 } from 'lucide-react';
import { api, json } from '../api/client';

export default function JoinBoard() {
  const { token } = useParams(); const navigate = useNavigate(); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function join() { setBusy(true); setError(''); try { const result = await api(`/join/${token}`, json('POST', {})); if (result.status === 'joined') navigate(`/board/${result.board_id}`); else setError('Your request was sent. The board owner must approve it before you can enter.'); } catch (e) { setError(e.message); } finally { setBusy(false); } }
  return <main className="page-loading"><section className="modal"><span className="modal-symbol"><Link2 size={18}/></span><h2>Join a board</h2><p className="modal-copy">Use this link to join the shared workspace.</p>{error && <p className="form-notice">{error}</p>}<button className="button button-primary full-button" disabled={busy} onClick={join}>{busy ? 'Checking link…' : 'Continue'}</button></section></main>;
}
