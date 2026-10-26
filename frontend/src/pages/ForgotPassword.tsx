import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { Icon } from '../components/Icon';
import { apiUrl } from '../lib/apiBase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    // Fire and forget: the response is the same whether or not the account exists.
    await fetch(apiUrl('/api/auth/forgot-password'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }).catch(() => null);
    setSent(true);
    setBusy(false);
  };

  return (
    <AuthLayout image="cafeWeekend" quote={<>“It happens to the best-dressed of us.”</>}>
      {sent ? (
        <div className="stack" style={{ gap: 20 }}>
          <span className="icon-btn is-on" style={{ width: 56, height: 56 }}>
            <Icon name="check" size={24} stroke={2} />
          </span>
          <h1 className="h1">
            Check your <span className="wink">inbox.</span>
          </h1>
          <p className="body">
            If there's an account for <strong style={{ color: 'var(--ink)' }}>{email}</strong>, a reset link is on its way. It expires in an hour.
          </p>
          <div className="row" style={{ gap: 10 }}>
            <Link to="/login" className="btn btn-primary">
              Back to log in
            </Link>
            <button className="btn btn-ghost" onClick={() => setSent(false)}>
              Use another email
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="stack" style={{ gap: 10 }}>
            <h1 className="h1">
              Forgot your <span className="wink">password?</span>
            </h1>
            <p className="body">Pop your email in and we'll send you a link to set a new one.</p>
          </div>
          <form className="stack" style={{ gap: 16 }} onSubmit={submit}>
            <div className="field">
              <label className="label" htmlFor="email">
                Email
              </label>
              <input id="email" className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <button className="btn btn-primary btn-lg btn-block" disabled={busy}>
              {busy ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
          <Link to="/login" className="small row" style={{ gap: 6, fontWeight: 600, color: 'var(--ink)', textDecoration: 'none' }}>
            <Icon name="arrowLeft" size={16} /> Back to log in
          </Link>
        </>
      )}
    </AuthLayout>
  );
}
