import { useEffect, useState } from 'react';
import { Copy, Link2, X, UserCheck, Ban, UserMinus } from 'lucide-react';
import { api, json } from '../api/client';

export default function BoardShareModal({ boardId, onClose }) {
  const [mode, setMode] = useState('anyone'); const [links, setLinks] = useState([]); const [requests, setRequests] = useState([]); const [members, setMembers] = useState([]); const [freshLink, setFreshLink] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function load() { try { const [l, r, m] = await Promise.all([api(`/boards/${boardId}/join-links`), api(`/boards/${boardId}/join-requests`), api(`/boards/${boardId}/members`)]); setLinks(l); setRequests(r); setMembers(m.members || []); } catch (e) { setError(e.message); } }
  useEffect(() => { load(); }, [boardId]);
  async function createLink(e) { e.preventDefault(); setBusy(true); setError(''); try { const created = await api(`/boards/${boardId}/join-links`, json('POST', { mode })); setFreshLink(created.url); await load(); } catch (e) { setError(e.message); } finally { setBusy(false); } }
  async function review(requestId, decision) { try { await api(`/join-requests/${requestId}/review`, json('POST', { decision })); await load(); } catch (e) { setError(e.message); } }
  async function revoke(linkId) { try { await api(`/join-links/${linkId}`, { method: 'DELETE' }); await load(); } catch (e) { setError(e.message); } }
  async function changeRole(userId, role) { setError(''); try { await api(`/boards/${boardId}/members/${userId}`, json('PATCH', { role })); await load(); } catch (e) { setError(e.message); await load(); } }
  async function removeMember(userId) { if (!window.confirm('Remove this person from the board?')) return; setError(''); try { await api(`/boards/${boardId}/members/${userId}`, { method: 'DELETE' }); await load(); } catch (e) { setError(e.message); } }
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><section className="modal share-modal"><div className="modal-head"><span className="modal-symbol"><Link2 size={18}/></span><button className="icon-button" onClick={onClose}><X size={18}/></button></div><h2>Share this board</h2><p className="modal-copy">Create a link that lets people join or request access.</p>
    <form onSubmit={createLink} className="share-create"><label>Link access<select value={mode} onChange={(e) => setMode(e.target.value)}><option value="anyone">Anyone with link can join</option><option value="approval">Request access; owner approves</option></select></label><button className="button button-primary" disabled={busy}><Link2 size={15}/>{busy ? 'Creating…' : 'Create link'}</button></form>
    {freshLink && <div className="fresh-link"><input readOnly value={freshLink}/><button className="button button-quiet" onClick={() => navigator.clipboard.writeText(freshLink)}><Copy size={14}/> Copy</button></div>}
    {error && <p className="form-error">{error}</p>}
    <div className="share-list"><h3>Members · {members.length}</h3>{members.map((m) => <div className="share-row member-manage-row" key={m.id}><span className="member-avatar">{m.email?.[0]?.toUpperCase() || '?'}</span><span className="member-email">{m.email}</span><select aria-label={`Role for ${m.email}`} value={m.role} onChange={(e) => changeRole(m.id,e.target.value)}><option value="owner">Owner</option><option value="member">Member</option><option value="viewer">Viewer</option></select><button title="Remove member" onClick={() => removeMember(m.id)}><UserMinus size={15}/></button></div>)}</div>
    {requests.length > 0 && <div className="share-list"><h3>Join requests</h3>{requests.map((r) => <div className="share-row" key={r.id}><span>{r.email}</span><button title="Approve" onClick={() => review(r.id,'approved')}><UserCheck size={16}/></button><button title="Decline" onClick={() => review(r.id,'rejected')}><Ban size={15}/></button></div>)}</div>}
    {links.length > 0 && <div className="share-list"><h3>Active links</h3>{links.filter((l) => !l.revoked_at).map((l) => <div className="share-row" key={l.id}><span>{l.mode === 'anyone' ? 'Anyone can join' : 'Owner approval required'}</span><button title="Revoke link" onClick={() => revoke(l.id)}><X size={15}/></button></div>)}</div>}
  </section></div>;
}
