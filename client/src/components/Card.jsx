import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlignLeft, GripVertical, MoreHorizontal } from 'lucide-react';

export default function Card({ card, disabled, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id, disabled, data: { type: 'card', listId: card.list_id } });
  return <article ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.45 : 1 }} className="task-card" onClick={() => onClick(card)}>
    <div className="card-topline"><span className={`priority-dot ${card.description ? 'has-note' : ''}`} /><button className="icon-button tiny" aria-label="Move card" {...attributes} {...listeners} onClick={(e) => e.stopPropagation()}><GripVertical size={15} /></button></div>
    <h4>{card.title}</h4>
    {card.description && <p className="card-description">{card.description}</p>}
    <div className="card-footer">{card.description ? <span><AlignLeft size={13} /> Details</span> : <span /> }<button className="icon-button tiny" aria-label="Edit card" onClick={(e) => { e.stopPropagation(); onClick(card); }}><MoreHorizontal size={16} /></button></div>
  </article>;
}
