import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, MoreHorizontal } from 'lucide-react';
import Card from './Card';

export default function BoardList({ list, disabled, fixed = false, onAddCard, onCard, onRename, onDelete }) {
  const [menu, setMenu] = useState(false);
  const { setNodeRef, isOver } = useDroppable({ id: list.id, disabled, data: { type: 'list', listId: list.id } });
  return <section ref={setNodeRef} className={`list-column ${isOver ? 'list-over' : ''}`}>
    <header className="list-heading"><div className="list-title-wrap"><span className={`list-color color-${list.color || 'slate'}`} /><h3>{list.title}</h3><span className="count-pill">{list.cards.length}</span></div>
      {!disabled && <div className="list-actions"><button className="icon-button" onClick={() => onAddCard(list)} aria-label="Add a card"><Plus size={17} /></button>{!fixed && <div className="menu-anchor"><button className="icon-button" aria-label="List options" onClick={() => setMenu(!menu)}><MoreHorizontal size={18} /></button>{menu && <div className="pop-menu"><button onClick={() => { setMenu(false); onRename(list); }}>Rename list</button><button className="danger-text" onClick={() => { setMenu(false); onDelete(list); }}>Delete list</button></div>}</div>}</div>}
    </header>
    <SortableContext items={list.cards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
      <div className="card-stack">{list.cards.map((card) => <Card key={card.id} card={card} disabled={disabled} onClick={onCard} />)}</div>
    </SortableContext>
    {!disabled && <button className="add-card" onClick={() => onAddCard(list)}><Plus size={16} /> Add a card</button>}
  </section>;
}
