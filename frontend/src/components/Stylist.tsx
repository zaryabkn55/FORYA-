import { FormEvent, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AI_LABEL, type AiSource, type Turn } from '../lib/ai';
import { askStylist, suggestedPrompts } from '../lib/aiStylist';
import { money } from '../lib/format';
import { useSession } from '../lib/session';
import { useStore } from '../lib/store';
import type { Moment, Product } from '../lib/types';
import { useStylistContext } from '../lib/useStylist';
import { Icon } from './Icon';
import { useProductDrawer } from './ProductDrawer';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  products?: Product[];
  moment?: Moment;
  source?: AiSource;
}

/** "Ask FORYA": the AI stylist, one tap away on every signed-in page. */
export function Stylist() {
  const { user } = useSession();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  // Other parts of the app can open it with a question: window.dispatchEvent(new CustomEvent('forya:ask', { detail: '…' })).
  const [pending, setPending] = useState<string | null>(null);
  useEffect(() => {
    const on = (e: Event) => {
      setOpen(true);
      setPending((e as CustomEvent<string>).detail ?? null);
    };
    window.addEventListener('forya:ask', on);
    return () => window.removeEventListener('forya:ask', on);
  }, []);

  if (!user || /^\/moments\/[^/]+/.test(pathname) || pathname.startsWith('/look/')) return null;
  return (
    <>
      {!open && (
        <button className="stylist-fab" onClick={() => setOpen(true)} aria-label="Ask FORYA, your AI stylist">
          <Icon name="sparkle" size={18} /> <span>Ask FORYA</span>
        </button>
      )}
      {open && <StylistPanel onClose={() => setOpen(false)} pending={pending} clearPending={() => setPending(null)} />}
    </>
  );
}

function StylistPanel({ onClose, pending, clearPending }: { onClose: () => void; pending: string | null; clearPending: () => void }) {
  const { ctx, source } = useStylistContext();
  const { kindOf, setKind, toast } = useStore();
  const drawer = useProductDrawer();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const ctl = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    const next = [...messages, { role: 'user' as const, text: q }];
    setMessages(next);
    setDraft('');
    setBusy(true);
    ctl.current = new AbortController();
    try {
      const history: Turn[] = next.map((m) => ({ role: m.role, content: m.text }));
      const a = await askStylist(history, ctx, ctl.current.signal);
      setMessages((ms) => [...ms, { role: 'assistant', text: a.reply, products: a.products, moment: a.moment, source: a.source }]);
    } catch (e) {
      if ((e as { code?: string }).code !== 'cancelled' && (e as Error).name !== 'AbortError') setMessages((ms) => [...ms, { role: 'assistant', text: 'Something went wrong there. Ask me again?' }]);
    } finally {
      setBusy(false);
    }
  };

  // A question handed over from elsewhere in the app.
  useEffect(() => {
    if (pending && ctx.products.length) {
      send(pending);
      clearPending();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, ctx.products.length]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    send(draft);
  };

  const prompts = suggestedPrompts(ctx.moments, ctx.shopsFor);

  return (
    <aside className="stylist" role="dialog" aria-label="FORYA stylist">
      <header className="stylist-head">
        <div className="row" style={{ gap: 10 }}>
          <span className="stylist-mark">
            <Icon name="sparkle" size={18} />
          </span>
          <div className="stack" style={{ gap: 0 }}>
            <span className="h4" style={{ fontSize: 16 }}>
              Ask <span className="wink">FORYA</span>
            </span>
            <span className="small">{source ? `${AI_LABEL[source]} · ${ctx.shopsFor === 'men' ? 'Menswear' : 'Womenswear'}` : 'Waking up…'}</span>
          </div>
        </div>
        <button className="icon-btn icon-btn-sm" onClick={onClose} aria-label="Close">
          <Icon name="close" size={18} />
        </button>
      </header>

      <div className="stylist-body" ref={listRef}>
        {messages.length === 0 && (
          <div className="stack" style={{ gap: 14 }}>
            <p className="body" style={{ margin: 0 }}>
              Tell me where you're going and what you're doing. I'll check the weather, your budget and what you already own, and pull the pieces.
            </p>
            <div className="stack" style={{ gap: 8 }}>
              {prompts.map((p) => (
                <button key={p} className="stylist-prompt" onClick={() => send(p)}>
                  {p} <Icon name="arrowRight" size={15} />
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            <p>{m.text}</p>
            {!!m.products?.length && (
              <div className="bubble-products">
                {m.products.map((p) => (
                  <button key={p.id} className="mini-card" onClick={() => drawer.open(p.id)}>
                    <span className="mini-media">
                      <img src={p.imageUrl} alt="" loading="lazy" />
                      <span
                        className={`mini-save ${kindOf(p.id) === 'saved' ? 'is-on' : ''}`}
                        role="button"
                        aria-label="Save"
                        onClick={(e) => {
                          e.stopPropagation();
                          const on = kindOf(p.id) === 'saved';
                          setKind(p.id, on ? null : 'saved');
                          toast(on ? 'Removed from saved' : 'Saved.');
                        }}
                      >
                        <Icon name="heart" size={14} />
                      </span>
                    </span>
                    <span className="brand-label">{p.brand}</span>
                    <span className="mini-name">{p.name}</span>
                    <span className="small">{money(p.price)}</span>
                  </button>
                ))}
              </div>
            )}
            {m.moment && m.role === 'assistant' && (
              <button className="btn btn-quiet btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => navigate(`/moments/${m.moment!.id}?style=1`)}>
                <Icon name="wand" size={16} /> Style my {m.moment.title} look
              </button>
            )}
            {m.role === 'assistant' && m.source && <span className="bubble-source">{m.source === 'local' ? 'On-device stylist' : 'Claude'}</span>}
          </div>
        ))}
        {busy && (
          <div className="bubble assistant">
            <p className="thinking">
              <span />
              <span />
              <span />
            </p>
          </div>
        )}
      </div>

      <form className="stylist-input" onSubmit={submit}>
        <input ref={inputRef} className="input" placeholder="e.g. Linen for Lisbon under £100" value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Ask the stylist" />
        {busy ? (
          <button type="button" className="btn btn-quiet" onClick={() => ctl.current?.abort()}>
            Stop
          </button>
        ) : (
          <button className="btn btn-primary" disabled={!draft.trim()} aria-label="Send">
            <Icon name="arrowRight" size={18} />
          </button>
        )}
      </form>
    </aside>
  );
}
