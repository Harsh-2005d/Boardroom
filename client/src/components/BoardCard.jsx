import { ArrowUpRight, LayoutGrid } from 'lucide-react';
import { Link } from 'react-router-dom';

const palettes = ['violet', 'amber', 'mint', 'blue'];
export default function BoardCard({ board, index = 0 }) {
  return <Link className={`board-tile tile-${palettes[index % palettes.length]}`} to={`/board/${board.id}`}>
    <div className="tile-top"><span className="tile-icon"><LayoutGrid size={18} /></span><ArrowUpRight size={18} /></div>
    <div><span className="eyebrow">{board.role} workspace</span><h3>{board.title}</h3><p>Open workspace <span>→</span></p></div>
  </Link>;
}
