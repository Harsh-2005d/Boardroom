import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export default function CardModal({ card, onClose, onSave, onDelete, disabled }) {
  const [title, setTitle] = useState(card?.title || '');
  const [description, setDescription] = useState(card?.description || '');
  useEffect(() => { setTitle(card?.title || ''); setDescription(card?.description || ''); }, [card]);
  if (!card) return null;
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><section className="modal card-modal">
    <div className="modal-head"><span className="eyebrow">CARD DETAILS</span><button className="icon-button" onClick={onClose}><X size={18} /></button></div>
    {disabled ? <><h2>{card.title}</h2><p className="readonly-description">{card.description || 'No description yet.'}</p></> : <form onSubmit={(e) => { e.preventDefault(); onSave({ title, description }); }}>
      <label>Card title<input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required /></label>
      <label>Description<textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} placeholder="Add a few details to help your team…" /></label>
      <div className="modal-actions"><button type="button" className="button button-quiet danger-text" onClick={onDelete}>Delete card</button><span /><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button className="button button-primary">Save changes</button></div>
    </form>}
  </section></div>;
}
