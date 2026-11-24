import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { supabase, supabaseConfigError } from './lib/supabase';
import Login from './pages/Login';
import Home from './pages/Home';
import Board from './pages/Board';
import JoinBoard from './pages/JoinBoard';

function Protected({ session, children }) { const location = useLocation(); return session ? children : <Navigate to="/login" replace state={{ from: location }} />; }
function AppRoutes() {
  const [session, setSession] = useState(null); const [ready, setReady] = useState(false);
  useEffect(() => {
    if (supabaseConfigError) { setReady(true); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => { setSession(nextSession); setReady(true); });
    return () => subscription.unsubscribe();
  }, []);
  if (!ready) return <div className="page-loading"><span className="spinner" /> Getting your workspace ready…</div>;
  if (supabaseConfigError) return <div className="page-loading"><div className="inline-error">{supabaseConfigError}</div></div>;
  return <Routes><Route path="/login" element={<Login session={session} />} /><Route path="/join/:token" element={<Protected session={session}><JoinBoard /></Protected>} /><Route path="/" element={<Protected session={session}><Home user={session?.user} /></Protected>} /><Route path="/board/:id" element={<Protected session={session}><Board user={session?.user} /></Protected>} /><Route path="*" element={<Navigate to="/" replace />} /></Routes>;
}
export default function App() { return <BrowserRouter><AppRoutes /></BrowserRouter>; }
