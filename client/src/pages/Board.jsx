import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DndContext, PointerSensor, closestCorners, useSensor, useSensors } from '@dnd-kit/core';
import { ArrowLeft, ChevronDown, MoreHorizontal, Plus, Sparkles, UsersRound, LayoutDashboard, CircleHelp } from 'lucide-react';
import { api, json } from '../api/client';
import { supabase } from '../lib/supabase';
import { useBoard } from '../hooks/useBoard';
import BoardList from '../components/List';
import CardModal from '../components/CardModal';
import NewTaskModal from '../components/NewTaskModal';
import BoardShareModal from '../components/BoardShareModal';
import AISummaryPanel from '../components/AISummaryPanel';

const listColors = ['violet', 'amber', 'mint'];
export default function Board({ user }) {
  const { id } = useParams(); const navigate = useNavigate(); const { board, lists, setLists, role, loading, error, refresh } = useBoard(id);
  const [card, setCard] = useState(null); const [newTaskStatus, setNewTaskStatus] = useState(null); const [taskBusy, setTaskBusy] = useState(false); const [inviteOpen, setInviteOpen] = useState(false); const [membersOpen, setMembersOpen] = useState(false); const [summaryOpen, setSummaryOpen] = useState(false); const [busy, setBusy] = useState(false); const [toast, setToast] = useState('');
  const editable = role === 'owner' || role === 'member'; const isOwner = role === 'owner'; const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const cardIndex = useMemo(() => Object.fromEntries(lists.flatMap((list) => list.cards.map((item) => [item.id, list.id]))), [lists]);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(''), 2800); return () => clearTimeout(t); } }, [toast]);
  async function addCard(column) { setNewTaskStatus(column.id); }
  async function createCard(values) { setTaskBusy(true); try { await api(`/boards/${id}/cards`, json('POST', values)); setNewTaskStatus(null); await refresh(); } catch (e) { setToast(e.message); } finally { setTaskBusy(false); } }
  async function saveCard(values) { try { await api(`/cards/${card.id}`, json('PATCH', values)); setCard(null); await refresh(); } catch (e) { setToast(e.message); } }
  async function deleteCard() { if (!window.confirm(`Delete “${card.title}”?`)) return; try { await api(`/cards/${card.id}`, { method: 'DELETE' }); setCard(null); await refresh(); } catch (e) { setToast(e.message); } }
  async function moveCard(event) {
    const { active, over } = event; if (!over || active.id === over.id) return;
    const fromId = cardIndex[active.id];
    const toId = lists.some((column) => column.id === over.id) ? over.id : cardIndex[over.id];
    if (!fromId || !toId) return;
    const source = lists.find((column) => column.id === fromId); const target = lists.find((column) => column.id === toId);
    const moving = source.cards.find((item) => item.id === active.id); if (!moving) return;
    const sourceCards = source.cards.filter((item) => item.id !== active.id);
    const targetCards = fromId === toId ? sourceCards : [...target.cards];
    const overIndex = lists.some((column) => column.id === over.id) ? targetCards.length : targetCards.findIndex((item) => item.id === over.id);
    const insertAt = Math.max(0, overIndex < 0 ? targetCards.length : overIndex);
    const nextCards = [...targetCards]; nextCards.splice(insertAt, 0, { ...moving, status: toId, list_id: toId });
    const before = nextCards[insertAt - 1]?.position; const after = nextCards[insertAt + 1]?.position;
    const position = before == null && after == null ? 1000 : before == null ? after - 1000 : after == null ? before + 1000 : (before + after) / 2;
    const gap = before != null && after != null ? after - before : Infinity;
    const normalized = nextCards.map((item, i) => i === insertAt ? { ...item, position } : item);
    setLists(lists.map((column) => column.id === fromId && fromId === toId ? { ...column, cards: normalized } : column.id === fromId ? { ...column, cards: sourceCards } : column.id === toId ? { ...column, cards: normalized } : column));
    try {
      await api(`/cards/${moving.id}`, json('PATCH', { status: toId, position }));
    } catch (e) { setToast(e.message); await refresh(); }
  }
  async function invite(email, memberRole) { await api(`/boards/${id}/invite`, json('POST', { email, role: memberRole })); setToast(`Invite sent to ${email}`); }
  async function deleteBoard() { if (!window.confirm(`Delete “${board?.title}”? This also deletes all its cards.`)) return; try { await api(`/boards/${id}`, { method: 'DELETE' }); navigate('/'); } catch (e) { setToast(e.message); } }
  async function signOut() { await supabase.auth.signOut(); }
  if (loading) return <div className="page-loading"><span className="spinner" /> Opening your board…</div>;
  if (error || !board) return <div className="page-loading error-loading"><p>{error || 'This board is unavailable.'}</p><button className="button button-quiet" onClick={() => navigate('/')}>Back to workspace</button></div>;
  return <div className="app-shell"><aside className="sidebar"><a href="/" className="brand-lockup"><span className="brand-mark"><LayoutDashboard size={18} /></span> boardroom</a><div className="workspace-switch"><span className="workspace-avatar">{user?.email?.[0]?.toUpperCase() || 'W'}</span><span className="workspace-name">My workspace<small>Personal space</small></span><ChevronDown size={15} /></div><div className="side-label">WORKSPACE</div><a className="side-link" href="/"><LayoutDashboard size={17} /> Overview</a><div className="side-label boards-label">YOUR BOARDS</div><div className="side-board-list"><a className="selected-board" href={`/board/${id}`}><span className="mini-board mini-0" />{board.title}</a></div><div className="sidebar-bottom"><div className="sidebar-help"><CircleHelp size={15} /><span>Need a hand? <a href="mailto:hello@boardroom.app">Get in touch</a></span></div><button className="user-menu" onClick={signOut}><span className="user-avatar">{user?.email?.[0]?.toUpperCase() || 'U'}</span><span>{user?.email}<small>Sign out</small></span><MoreHorizontal size={15} /></button></div></aside>
    <main className="main-area board-area"><header className="topbar"><div className="crumb"><a href="/">Workspace</a><span>/</span><b>{board.title}</b></div><div className="topbar-actions"><div className="members-wrap"><button className="members-button" onClick={() => setMembersOpen(!membersOpen)} aria-expanded={membersOpen}><span className="avatar-stack">{(board.members || []).slice(0,3).map((member) => <span className="top-avatar" title={member.email} key={member.id}>{member.email?.[0]?.toUpperCase() || '?'}</span>)}</span><span>{board.members?.length || 0} members</span></button>{membersOpen && <div className="members-popover"><b>Board members</b>{(board.members || []).map((member) => <div className="member-row" key={member.id}><span className="member-avatar">{member.email?.[0]?.toUpperCase() || '?'}</span><span>{member.email}</span><small>{member.role}</small></div>)}</div>}</div><button className="button button-quiet invite-button" onClick={() => setInviteOpen(true)} disabled={!isOwner} title={!isOwner ? 'Only board owners can manage access' : ''}><UsersRound size={16} /> Share & access</button><button className="icon-button notification" aria-label="Notifications"><CircleHelp size={17} /></button></div></header>
      <div className="board-content"><div className="board-title-row"><div className="board-title-copy"><a href="/" className="back-link"><ArrowLeft size={14} /> All boards</a><h1>{board.title}<button className="title-chevron" aria-label="Board options" onClick={() => role === 'owner' && setBusy(!busy)}><ChevronDown size={18} /></button></h1><div className="board-meta"><span className={`role-tag role-${role}`}>{role}</span><span className="meta-dot" /> <span>{lists.reduce((sum, l) => sum + l.cards.length, 0)} cards</span></div>{busy && role === 'owner' && <div className="board-menu"><button className="danger-text" onClick={deleteBoard}>Delete board</button></div>}</div><div className="board-actions"><button className="button button-soft-ai" onClick={() => setSummaryOpen(!summaryOpen)}><Sparkles size={16} /> AI summary</button><button className="icon-button board-more" onClick={() => setBusy(!busy)} aria-label="Board options"><MoreHorizontal size={19} /></button></div></div>
        <div className="board-divider" />
        {<DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={editable ? moveCard : undefined}><div className="board-scroller"><div className="board-lists">{lists.map((list, i) => <BoardList key={list.id} list={{ ...list, color: listColors[i % listColors.length] }} disabled={!editable} fixed onAddCard={addCard} onCard={setCard} />)}</div></div></DndContext>}
      </div>{summaryOpen && <AISummaryPanel boardId={id} onClose={() => setSummaryOpen(false)} />}{toast && <div className="toast">{toast}</div>}
    </main>{card && <CardModal card={card} disabled={!editable} onClose={() => setCard(null)} onSave={saveCard} onDelete={deleteCard} />}{newTaskStatus && <NewTaskModal status={newTaskStatus} busy={taskBusy} onClose={() => setNewTaskStatus(null)} onCreate={createCard} />}{inviteOpen && <BoardShareModal boardId={id} onClose={() => setInviteOpen(false)} />}</div>;
}
