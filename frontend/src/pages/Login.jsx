import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CloudSun, LockKeyhole } from 'lucide-react';
import { api, jsonBody } from '../api';
import { useAuth } from '../auth/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = await api('/auth/login', { method: 'POST', body: jsonBody(form) });
      signIn(result);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) { setError(err.message || 'Unable to sign in.'); }
    finally { setBusy(false); }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand"><span className="auth-brand-icon"><CloudSun size={25} /></span><div><strong>HeatwaveIQ</strong><small>Climate intelligence portal</small></div></div>
        <div className="auth-heading"><span className="auth-eyebrow">SECURE WORKSPACE</span><h1>Sign in</h1><p>Use your monitoring portal account to continue.</p></div>
        <form onSubmit={submit} className="auth-form">
          <label className="auth-field"><span>Username</span><input autoComplete="username" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} required minLength={4} /></label>
          <label className="auth-field"><span>Password</span><input type="password" autoComplete="current-password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required /></label>
          {error && <div className="auth-error" role="alert">{error}</div>}
          <button className="button button-primary auth-submit" type="submit" disabled={busy}><LockKeyhole size={15} />{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <p className="auth-switch">New operator? <Link to="/register">Create an operator account</Link></p>
        <p className="auth-disclaimer">Academic decision-support prototype. Not an official meteorological warning service.</p>
      </section>
    </main>
  );
}
