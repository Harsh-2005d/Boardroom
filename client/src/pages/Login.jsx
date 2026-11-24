import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Check, LayoutDashboard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { api, json } from '../api/client';

export default function Login({ session }) {
  const [mode, setMode] = useState('login'); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [busy, setBusy] = useState(false); const navigate = useNavigate(); const location = useLocation();
  const [expiredLink, setExpiredLink] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    if (params.get('error_code') === 'otp_expired') {
      setExpiredLink(true);
      setError('That confirmation link has expired. Request a fresh email below.');
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }
  }, []);
  if (session) return <Navigate to="/" replace />;
  async function submit(e) {
    e.preventDefault(); if (busy) return; setError(''); setNotice(''); setBusy(true);
    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError(error.message); else if (data.session) navigate(location.state?.from?.pathname || '/');
      } else {
        const result = await api('/auth/register', json('POST', { email, password, emailRedirectTo: `${window.location.origin}/login` }));
        if (result.session) {
          const { error } = await supabase.auth.setSession({ access_token: result.session.access_token, refresh_token: result.session.refresh_token });
          if (error) setError(error.message); else navigate(location.state?.from?.pathname || '/');
        } else setNotice(result.message || 'Check your inbox to confirm your account, then come back to sign in.');
      }
    } catch (err) {
      setError(err.message || 'Could not reach the registration service. Check that the API server is running and try again.');
    }
    finally { setBusy(false); }
  }
  async function resendConfirmation() {
    if (!email) { setError('Enter your email address first.'); return; }
    setBusy(true); setError('');
    const { error: resendError } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: `${window.location.origin}/login` } });
    setBusy(false);
    if (resendError) setError(resendError.message);
    else { setExpiredLink(false); setNotice('A fresh confirmation email is on its way.'); }
  }
  return <main className="auth-page">
    <div className="auth-art"><div className="brand-lockup light"><span className="brand-mark"><LayoutDashboard size={19} /></span> boardroom</div><div className="art-content"><div className="eyebrow">A CLEARER WAY TO WORK</div><h1>Good work<br />moves <em>together.</em></h1><p>One shared space for the plans, progress, and people that make your best work happen.</p><div className="art-board"><div className="art-board-head"><span>Launch planning</span><span>•••</span></div><div className="art-columns"><div><b>IN MOTION</b><span className="art-task">Shape the story</span><span className="art-task short">Review landing page</span></div><div><b>ON THE HORIZON</b><span className="art-task muted">Customer interviews</span></div></div></div></div><div className="art-bottom"><span>Thoughtful workspaces for thoughtful teams</span><span>✳</span></div></div>
    <section className="auth-main"><div className="auth-form-wrap"><div className="eyebrow">YOUR TEAM'S WORKSPACE</div><h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2><p className="auth-subtitle">{mode === 'login' ? 'Sign in to pick up where your team left off.' : 'Start organizing your team’s work today.'}</p>
      <form onSubmit={submit}><label>Email address<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required autoComplete="email" /></label><label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required minLength={8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>{error && <p className="form-error">{error}</p>}{notice && <p className="form-notice"><Check size={15} />{notice}</p>}{expiredLink && <button type="button" className="resend-link" onClick={resendConfirmation} disabled={busy}>Resend confirmation email</button>}<button className="button button-primary auth-submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}<ArrowUpRight size={17} /></button></form>
      <p className="auth-switch">{mode === 'login' ? 'New to Boardroom?' : 'Already have an account?'} <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setNotice(''); }}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></p>
    </div><div className="auth-legal">By continuing, you agree to keep your team’s work in good hands.</div></section>
  </main>;
}
