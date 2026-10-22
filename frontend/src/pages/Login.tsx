import { FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthLayout, SocialButtons, useAfterAuth } from '../components/AuthLayout';
import { Icon } from '../components/Icon';
import { api } from '../lib/api';

/** Seeded by `npm run seed` on the API, and always available in demo mode. */
const DEMO = { email: 'demo@forya.com', password: 'forya-demo-2026' };
const DEMO_MEN = { email: 'james@forya.com', password: 'forya-demo-2026' };

export default function Login() {
  const done = useAfterAuth();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const signInWith = async (mail: string, pass: string) => {
    setError('');
    setBusy(true);
    try {
      const { token, user } = await api.login(mail, pass);
      done(token, user, remember, `Welcome back, ${user.name.split(' ')[0]}.`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    signInWith(email.trim(), password);
  };
  const tryDemo = (d = DEMO) => {
    setEmail(d.email);
    setPassword(d.password);
    signInWith(d.email, d.password);
  };

  const next = params.get('next');
  return (
    <AuthLayout image="edDinner" quote={<>“Dinner on Friday, sorted on Tuesday.”</>}>
      <div className="stack" style={{ gap: 10 }}>
        <h1 className="h1">
          Welcome <span className="wink">back.</span>
        </h1>
        <p className="body">Your moments, looks and saved pieces are waiting.</p>
      </div>

      <form className="stack" style={{ gap: 16 }} onSubmit={submit}>
        <div className="field">
          <label className="label" htmlFor="email">
            Email
          </label>
          <input id="email" className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <div className="row between">
            <label className="label" htmlFor="password">
              Password
            </label>
            <Link to="/forgot-password" className="small" style={{ fontWeight: 600 }}>
              Forgot it?
            </Link>
          </div>
          <input
            id="password"
            className="input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <label className="check">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Keep me signed in
        </label>
        {error && <div className="form-error">{error}</div>}
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>
          {busy ? 'Signing in…' : 'Log in'}
        </button>
      </form>

      <div className="divider">or</div>
      <SocialButtons onError={setError} />
      <div className="demo-logins">
        <button type="button" className="demo-login" onClick={() => tryDemo(DEMO)} disabled={busy}>
          <span className="stack" style={{ gap: 2, textAlign: 'left' }}>
            <span className="h4" style={{ fontSize: 15 }}>
              Explore as Celine
            </span>
            <span className="small">Womenswear demo. Six moments planned, from a wedding to a work trip.</span>
          </span>
          <Icon name="arrowRight" size={18} />
        </button>
        <button type="button" className="demo-login" onClick={() => tryDemo(DEMO_MEN)} disabled={busy}>
          <span className="stack" style={{ gap: 2, textAlign: 'left' }}>
            <span className="h4" style={{ fontSize: 15 }}>
              Explore as James
            </span>
            <span className="small">Menswear demo. Same week, dressed from the menswear edit.</span>
          </span>
          <Icon name="arrowRight" size={18} />
        </button>
      </div>

      <p className="small" style={{ textAlign: 'center', margin: 0 }}>
        New to FORYA?{' '}
        <Link to={next ? `/register?next=${encodeURIComponent(next)}` : '/register'} style={{ fontWeight: 600, color: 'var(--ink)' }}>
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
