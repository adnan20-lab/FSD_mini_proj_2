import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CloudSun, UserPlus } from 'lucide-react';
import { api, jsonBody } from '../api';
import { useAuth } from '../auth/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('The passwords do not match.'); return; }
    setBusy(true);
    try {
      const result = await api('/auth/register', { method: 'POST', body: jsonBody({ username: form.username, password: form.password }) });
      signIn(result);
      navigate('/', { replace: true });
    } catch (err) { setError(err.message || 'Unable to create the account.'); }
    finally { setBusy(false); }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand"><span className="auth-brand-icon"><CloudSun size={25} /></span><div><strong>HeatwaveIQ</strong><small>Climate intelligence portal</small></div></div>
        <div className="auth-heading"><span className="auth-eyebrow">OPERATOR ACCESS</span><h1>Create account</h1><p>Operator accounts can record observations and manage advisories.</p></div>
        <form onSubmit={submit} className="auth-form">
          <label className="auth-field"><span>Username</span><input autoComplete="username" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} required minLength={4} maxLength={32} pattern="[a-zA-Z0-9._-]+" /><small>4–32 characters: letters, numbers, dot, underscore or hyphen.</small></label>
          <label className="auth-field"><span>Password</span><input type="password" autoComplete="new-password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required minLength={10} maxLength={72} /><small>Use at least 10 characters.</small></label>
          <label className="auth-field"><span>Confirm password</span><input type="password" autoComplete="new-password" value={form.confirmPassword} onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} required /></label>
          {error && <div className="auth-error" role="alert">{error}</div>}
          <button className="button button-primary auth-submit" type="submit" disabled={busy}><UserPlus size={15} />{busy ? 'Creating account…' : 'Create operator account'}</button>
        </form>
        <p className="auth-switch">Already registered? <Link to="/login">Sign in</Link></p>
        <p className="auth-disclaimer">Public registration creates an OPERATOR account only. Administrator access is configured separately.</p>
      </section>
    </main>
  );
}
