import { useState } from 'react';
import { X } from 'lucide-react';

export default function NewTaskModal({ status, onClose, onCreate, busy }) {
  const [title, setTitle] = useState(''); const [description, setDescription] = useState('');
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><section className="modal card-modal">
    <div className="modal-head"><span className="eyebrow">NEW TASK · {status.replace('_', ' ').toUpperCase()}</span><button className="icon-button" onClick={onClose}><X size={18} /></button></div>
    <h2>Create a task</h2><p className="modal-copy">Add a task to this board lane. You can add details now or later.</p>
    <form onSubmit={(e) => { e.preventDefault(); onCreate({ title, description, status }); }}>
      <label>Task name<input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to get done?" maxLength={120} required /></label>
      <label>Description<textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Add context for your team…" /></label>
      <div className="modal-actions"><span /><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? 'Creating…' : 'Create task'}</button></div>
    </form>
  </section></div>;
}
