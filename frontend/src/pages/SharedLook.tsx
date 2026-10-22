/** Public page for a shared look: the canvas, every piece with a link to buy it, and friends' reactions. */
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BuyLink } from '../components/BuyLink';
import { Icon } from '../components/Icon';
import { Wordmark } from '../components/Logo';
import { api } from '../lib/api';
import { longDate, money } from '../lib/format';
import { REACTIONS, type Reaction, type Reactions, type SharedLook as Look } from '../lib/share';
import { useSession } from '../lib/session';
import { useStore } from '../lib/store';
import type { Product } from '../lib/types';
import './canvas.css';

export default function SharedLook() {
  const { payload, id } = useParams();
  const ref = useMemo(() => (id ? { id } : { payload }), [id, payload]);
  const { product } = useStore();
  const { user } = useSession();
  const [look, setLook] = useState<Look | null>(null);
  const [reactions, setReactions] = useState<Reactions | null>(null);
  const [mine, setMine] = useState<Reaction | undefined>();
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .sharedLook(ref)
      .then((r) => {
        setLook(r.look);
        setReactions(r.reactions);
        setMine(r.mine);
      })
      .catch((e) => setError((e as Error).message));
  }, [ref]);

  const react = async (r: Reaction) => {
    const res = await api.react(ref, r).catch(() => null);
    if (res) {
      setReactions(res.reactions);
      setMine(res.mine);
    }
  };

  if (error)
    return (
      <div className="page container">
        <div className="empty">
          <h3 className="h3">
            We couldn't open this look. <span className="wink">Sorry.</span>
          </h3>
          <p className="body">{error}</p>
          <Link to="/" className="btn btn-primary">
            Go to FORYA
          </Link>
        </div>
      </div>
    );

  if (!look)
    return (
      <div className="page container">
        <div className="skeleton" style={{ height: 600 }} />
      </div>
    );

  const items = Array.from(new Set(look.pieces.map((p) => p.productId)))
    .map((pid) => product(pid))
    .filter((p): p is Product => !!p);
  const total = items.reduce((s, p) => s + p.price, 0);
  const votes = reactions ? Object.values(reactions).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="page">
      <div className="container shared-grid">
        <section className="stack" style={{ gap: 18 }}>
          <span className="eyebrow">
            {look.by}'s look · {longDate(look.date)}
            {look.weather ? ` · ${look.weather.temperature}°` : ''}
          </span>
          <h1 className="h1">
            {look.title}. <span className="wink">Would you wear it?</span>
          </h1>
          <div className="board" style={{ cursor: 'default' }}>
            <span className="hand board-title">{look.title}.</span>
            {[...look.pieces]
              .sort((a, b) => a.z - b.z)
              .map((pc) => {
                const p = product(pc.productId);
                return p ? (
                  <div key={pc.id} className="piece" style={{ left: `${pc.x}%`, top: `${pc.y}%`, width: `${pc.w}%`, zIndex: pc.z + 10, cursor: 'default' }}>
                    <img src={p.imageUrl} alt={p.name} />
                  </div>
                ) : null;
              })}
          </div>

          <div className="reactions" role="group" aria-label="React to this look">
            {REACTIONS.map((r) => (
              <button key={r.id} className={`reaction ${mine === r.id ? 'is-on' : ''}`} onClick={() => react(r.id)} aria-pressed={mine === r.id}>
                <Icon name={r.icon} size={20} />
                <span>{r.label}</span>
                <span className="count">{reactions?.[r.id] ?? 0}</span>
              </button>
            ))}
          </div>
          <span className="small">{votes ? `${votes} reaction${votes === 1 ? '' : 's'} so far.` : 'Be the first to react.'}</span>
        </section>

        <aside className="look-panel" style={{ position: 'static', maxHeight: 'none' }}>
          <div className="stack" style={{ gap: 4 }}>
            <span className="eyebrow">Shop the look</span>
            <h2 className="h3">
              {items.length} pieces · {money(total)}
            </h2>
          </div>
          <div className="look-items">
            {items.map((p) => (
              <div key={p.id} className="look-item" style={{ cursor: 'default' }}>
                <span className="look-thumb">
                  <img src={p.imageUrl} alt="" />
                </span>
                <span className="grow stack" style={{ gap: 2, minWidth: 0 }}>
                  <span className="brand-label" style={{ fontSize: 9.5 }}>
                    {p.brand}
                  </span>
                  <span className="look-name">{p.name}</span>
                  <span className="price small" style={{ color: 'var(--ink)' }}>
                    {money(p.price)}
                  </span>
                </span>
                <BuyLink product={p} className="btn btn-quiet btn-sm">
                  Buy <Icon name="arrowUpRight" size={14} />
                </BuyLink>
              </div>
            ))}
          </div>
          <div className="shared-cta">
            <Wordmark size={26} />
            <p className="body" style={{ margin: 0 }}>
              Plan your own moments and style a look for each one, priced for the forecast and your budget.
            </p>
            <Link to={user ? '/moments?new=1' : '/register'} className="btn btn-primary">
              Style your own <Icon name="arrowRight" size={16} />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
