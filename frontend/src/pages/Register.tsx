import { FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthLayout, SocialButtons, useAfterAuth } from '../components/AuthLayout';
import { api } from '../lib/api';
import { useStore } from '../lib/store';
import { SHOPS_FOR_LABEL, type ShopsFor } from '../lib/types';

const COUNTRIES = ['United Kingdom', 'Ireland', 'United States', 'France', 'Germany', 'Italy', 'Spain', 'Netherlands', 'United Arab Emirates', 'Pakistan', 'India', 'Australia', 'Canada'];

export default function Register() {
  const done = useAfterAuth();
  const [params] = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('United Kingdom');
  const { department } = useStore();
  const [shopsFor, setShopsFor] = useState<ShopsFor>(department);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError('Use at least 8 characters for your password.');
    if (!agree) return setError('Please accept the terms to continue.');
    setError('');
    setBusy(true);
    try {
      const { token, user } = await api.register({ name: name.trim(), email: email.trim(), password, country, shopsFor });
      done(token, user, true, `Welcome to FORYA, ${user.name.split(' ')[0]}.`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  const next = params.get('next');
  const strength = password.length === 0 ? 0 : password.length < 8 ? 1 : /\d/.test(password) && /[A-Za-z]/.test(password) && password.length >= 10 ? 3 : 2;

  return (
    <AuthLayout image="edCocktail" quote={<>“Cocktails on Saturday. Decided on Tuesday.”</>}>
      <div className="stack" style={{ gap: 10 }}>
        <h1 className="h1">
          Let's get you <span className="wink">dressed.</span>
        </h1>
        <p className="body">Free to start. Your first moment takes under a minute.</p>
      </div>

      <SocialButtons onError={setError} />
      <div className="divider">or with email</div>

      <form className="stack" style={{ gap: 16 }} onSubmit={submit}>
        <div className="field">
          <label className="label" htmlFor="name">
            Your name
          </label>
          <input id="name" className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="field">
          <label className="label" htmlFor="email">
            Email
          </label>
          <input id="email" className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="input"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="row" style={{ gap: 6 }} aria-hidden>
            {[1, 2, 3].map((i) => (
              <span key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: strength >= i ? 'var(--ink)' : 'var(--linen)', transition: 'background .2s' }} />
            ))}
          </div>
          <span className="hint">At least 8 characters. Mix in a number for a stronger one.</span>
        </div>
        <div className="field">
          <span className="label" id="shops-for">
            I shop for
          </span>
          <div className="dept-switch" role="radiogroup" aria-labelledby="shops-for">
            {(['women', 'men'] as ShopsFor[]).map((d) => (
              <button type="button" key={d} role="radio" aria-checked={shopsFor === d} className={shopsFor === d ? 'is-active' : ''} onClick={() => setShopsFor(d)}>
                {SHOPS_FOR_LABEL[d]}
              </button>
            ))}
          </div>
          <span className="hint">You'll only see clothes from this department. Change it any time.</span>
        </div>
        <div className="field">
          <label className="label" htmlFor="country">
            Country
          </label>
          <select id="country" className="select input" value={country} onChange={(e) => setCountry(e.target.value)}>
            {COUNTRIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <label className="check">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span>
            I agree to the <a href="#terms">Terms</a> and <a href="#privacy">Privacy policy</a>.
          </span>
        </label>
        {error && <div className="form-error">{error}</div>}
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>
          {busy ? 'Creating your account…' : 'Create account'}
        </button>
      </form>

      <p className="small" style={{ textAlign: 'center', margin: 0 }}>
        Already have an account?{' '}
        <Link to={next ? `/login?next=${encodeURIComponent(next)}` : '/login'} style={{ fontWeight: 600, color: 'var(--ink)' }}>
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
