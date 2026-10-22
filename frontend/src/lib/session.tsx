import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import type { User } from './types';

const TOKEN_KEY = 'forya_auth_token';
const USER_KEY = 'forya_user';

const read = (k: string) => {
  try {
    return localStorage.getItem(k) ?? sessionStorage.getItem(k);
  } catch {
    return null;
  }
};

export const getToken = () => read(TOKEN_KEY);

function readUser(): User | null {
  try {
    const raw = read(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

interface Session {
  user: User | null;
  signIn: (token: string, user: User, remember?: boolean) => void;
  signOut: () => void;
  /** Merge changes into the signed-in user (kept wherever the session is stored). */
  updateUser: (patch: Partial<User>) => void;
}

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => (getToken() ? readUser() : null));

  const signIn = useCallback((token: string, u: User, remember = true) => {
    try {
      const store = remember ? localStorage : sessionStorage;
      store.setItem(TOKEN_KEY, token);
      store.setItem(USER_KEY, JSON.stringify(u));
    } catch {
      /* storage blocked: stay signed in for this visit only */
    }
    setUser(u);
  }, []);

  const signOut = useCallback(() => {
    try {
      for (const store of [localStorage, sessionStorage]) {
        store.removeItem(TOKEN_KEY);
        store.removeItem(USER_KEY);
      }
    } catch {
      /* ignore */
    }
    setUser(null);
  }, []);

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser((u) => {
      if (!u) return u;
      const next = { ...u, ...patch };
      try {
        const store = localStorage.getItem(USER_KEY) ? localStorage : sessionStorage;
        store.setItem(USER_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ user, signIn, signOut, updateUser }), [user, signIn, signOut, updateUser]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}
