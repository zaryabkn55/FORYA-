import { ReactNode } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useSession } from '../lib/session';
import { useStore } from '../lib/store';
import { img, type ImageKey } from '../lib/imagery';
import { Logo, Wordmark } from './Logo';
import { Photo } from './Photo';

export function AuthLayout({ image, quote, children }: { image: ImageKey; quote: ReactNode; children: ReactNode }) {
  return (
    <div className="auth">
      <div className="auth-form">
        <div className="auth-top">
          <Logo />
        </div>
        <div className="auth-body">{children}</div>
        <div className="small">© {new Date().getFullYear()} FORYA</div>
      </div>
      <div className="auth-art">
        <Photo src={img(image)} alt="" className="auth-photo" eager />
        <div className="auth-quote">
          <Wordmark size={22} tone="paper" />
          <p>{quote}</p>
        </div>
      </div>
    </div>
  );
}

/** Where to go after signing in: ?next=, the page that bounced us here, or home. */
export function useAfterAuth() {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { signIn } = useSession();
  const { toast } = useStore();
  const target = params.get('next') || (location.state as { from?: string } | null)?.from || '/dashboard';
  return (token: string, user: { id: string; name: string; email: string }, remember = true, greeting?: string) => {
    signIn(token, user, remember);
    if (greeting) toast(greeting);
    navigate(target.startsWith('/') ? target : '/dashboard', { replace: true });
  };
}

export function SocialButtons({ onError }: { onError: (msg: string) => void }) {
  const done = useAfterAuth();
  const go = async (provider: 'google' | 'apple') => {
    try {
      const { token, user } = await api.oauth(provider);
      done(token, user, true, `Welcome, ${user.name.split(' ')[0]}.`);
    } catch (e) {
      onError((e as Error).message);
    }
  };
  return (
    <div className="row" style={{ gap: 10 }}>
      <button type="button" className="btn btn-quiet grow" onClick={() => go('google')}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
          <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.4-.2-2.1H12v4h6c-.1 1-.8 2.6-2.4 3.6v3h3.8c2.2-2 3.2-5 3.2-8.5z" />
          <path fill="#34A853" d="M12 23c3 0 5.6-1 7.4-2.7l-3.8-3c-1 .7-2.3 1.2-3.6 1.2-2.9 0-5.3-1.9-6.2-4.5H1.9v3C3.7 20.6 7.5 23 12 23z" />
          <path fill="#FBBC05" d="M5.8 14c-.2-.7-.4-1.3-.4-2s.1-1.4.4-2V7H1.9C1.1 8.5.7 10.2.7 12s.4 3.5 1.2 5l3.9-3z" />
          <path fill="#EA4335" d="M12 5.5c1.7 0 2.8.7 3.5 1.3l2.6-2.5C16.5 2.8 14.5 2 12 2 7.5 2 3.7 4.4 1.9 7.9L5.8 11c.9-2.6 3.3-4.5 6.2-4.5z" />
        </svg>
        Google
      </button>
      <button type="button" className="btn btn-quiet grow" onClick={() => go('apple')}>
        <svg width="16" height="18" viewBox="0 0 17 20" aria-hidden>
          <path
            fill="currentColor"
            d="M14 10.6c0-2.5 2-3.7 2.1-3.8-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.8.9s-2-.9-3.3-.9C3.7 4.9 2.1 5.9 1.3 7.4c-1.8 3-.5 7.6 1.3 10.1.8 1.2 1.8 2.6 3.1 2.5 1.3 0 1.7-.8 3.3-.8 1.5 0 1.9.8 3.3.8 1.3 0 2.2-1.2 3-2.5 1-1.4 1.3-2.7 1.4-2.8-.1 0-2.7-1-2.7-4.1zM11.6 3.2c.7-.8 1.1-1.9 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.4z"
          />
        </svg>
        Apple
      </button>
    </div>
  );
}
