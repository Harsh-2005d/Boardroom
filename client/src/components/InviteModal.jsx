import { useState } from 'react';
import { X, UsersRound } from 'lucide-react';

export default function InviteModal({ onClose, onInvite }) {
  const [email, setEmail] = useState(''); const [role, setRole] = useState('member'); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><section className="modal invite-modal">
    <div className="modal-head"><span className="modal-symbol"><UsersRound size={19} /></span><button className="icon-button" onClick={onClose}><X size={18} /></button></div>
    <h2>Bring someone in</h2><p className="modal-copy">Invite a teammate to collaborate on this board.</p>
    <form onSubmit={async (e) => { e.preventDefault(); setBusy(true); setError(''); try { await onInvite(email, role); onClose(); } catch (err) { setError(err.message); } finally { setBusy(false); } }}>
      <label>Email address<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@company.com" required /></label>
      <label>Access level<select value={role} onChange={(e) => setRole(e.target.value)}><option value="member">Member · can edit work</option><option value="viewer">Viewer · can only view</option></select></label>
      {error && <p className="form-error">{error}</p>}<button className="button button-primary full-button" disabled={busy}>{busy ? 'Sending invite…' : 'Invite teammate'}</button>
    </form>
  </section></div>;
}
