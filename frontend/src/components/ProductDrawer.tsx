import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { money, shortDate } from '../lib/format';
import { placePiece } from '../lib/layout';
import { useSession } from '../lib/session';
import { useStore } from '../lib/store';
import type { Moment, PriceCheck as Check } from '../lib/types';
import { Icon } from './Icon';
import { BuyLink } from './BuyLink';
import { Drawer } from './Overlay';
import { PriceCheck } from './PriceCheck';

const Ctx = createContext<{ open: (productId: string) => void } | null>(null);

export function ProductDrawerProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState<string | null>(null);
  const open = useCallback((productId: string) => setId(productId), []);
  const value = useMemo(() => ({ open }), [open]);
  return (
    <Ctx.Provider value={value}>
      {children}
      {id && <ProductDrawer productId={id} onClose={() => setId(null)} />}
    </Ctx.Provider>
  );
}

export function useProductDrawer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useProductDrawer must be used inside <ProductDrawerProvider>');
  return ctx;
}

function ProductDrawer({ productId, onClose }: { productId: string; onClose: () => void }) {
  const { product, kindOf, setKind, toast } = useStore();
  const { user } = useSession();
  const navigate = useNavigate();
  const p = product(productId);
  const [check, setCheck] = useState<Check | null>(null);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [target, setTarget] = useState('');
  const [adding, setAdding] = useState(false);
  const kind = kindOf(productId);

  useEffect(() => {
    setCheck(null);
    api.priceCheck(productId).then(setCheck).catch(() => setCheck(null));
  }, [productId]);

  useEffect(() => {
    if (!user) return;
    api
      .moments()
      .then((ms) => {
        const upcoming = ms.filter((m) => new Date(m.date) >= new Date(Date.now() - 86_400_000));
        setMoments(upcoming);
        setTarget(upcoming[0]?.id ?? '');
      })
      .catch(() => setMoments([]));
  }, [user]);

  if (!p) return null;

  const requireUser = () => {
    if (user) return true;
    onClose();
    navigate('/login');
    return false;
  };

  const toggle = (next: 'saved' | 'owned') => {
    if (!requireUser()) return;
    if (kind === next) {
      setKind(p.id, null);
      toast(next === 'saved' ? 'Removed from saved' : 'Removed from your wardrobe');
    } else {
      setKind(p.id, next);
      toast(next === 'saved' ? 'Saved.' : 'Added to your wardrobe.', next === 'saved' ? 'Good eye.' : 'Nice.');
    }
  };

  const addToMoment = async () => {
    if (!requireUser() || !target) return;
    setAdding(true);
    try {
      const m = await api.moment(target);
      if (m.look.pieces.some((pc) => pc.productId === p.id)) {
        toast(`Already in ${m.title}`);
      } else {
        const pieces = [...m.look.pieces, placePiece(p, m.look.pieces)];
        await api.saveLook(m.id, { status: m.look.status === 'draft' ? 'in-progress' : m.look.status, pieces });
        toast(`Added to ${m.title}.`, 'Sorted.');
      }
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Drawer
      title={`${p.brand} · ${p.category}`}
      onClose={onClose}
      footer={
        <>
          <BuyLink product={p} className="btn btn-primary btn-lg drawer-buy">
            <Icon name="bag" size={18} /> Buy at {p.brand} <Icon name="arrowUpRight" size={16} />
          </BuyLink>
          <button className={`btn ${kind === 'saved' ? 'btn-oat' : 'btn-quiet'} grow`} onClick={() => toggle('saved')}>
            <Icon name="heart" size={18} /> {kind === 'saved' ? 'Saved' : 'Save'}
          </button>
          <button className={`btn ${kind === 'owned' ? 'btn-oat' : 'btn-quiet'} grow`} onClick={() => toggle('owned')}>
            <Icon name="hanger" size={18} /> {kind === 'owned' ? 'In your wardrobe' : 'I own this'}
          </button>
        </>
      }
    >
      <div className="stack" style={{ gap: 24 }}>
        <div style={{ background: 'var(--surface)', borderRadius: 24, aspectRatio: '1', display: 'grid', placeItems: 'center' }}>
          <img src={p.imageUrl} alt={p.name} style={{ width: '78%', height: '78%', objectFit: 'contain', mixBlendMode: 'multiply' }} />
        </div>

        <div className="stack" style={{ gap: 8 }}>
          <span className="brand-label">{p.brand}</span>
          <h2 className="h3" style={{ fontSize: 26 }}>
            {p.name}
          </h2>
          <div className="row" style={{ gap: 10 }}>
            <span className="price" style={{ fontSize: 22 }}>
              {money(p.price)}
            </span>
            <span className="badge badge-outline">{p.tier}</span>
          </div>
          {p.description && <p className="body">{p.description}</p>}
          <div className="row wrap small" style={{ gap: 18 }}>
            <span>Colour · {p.colorName}</span>
            {p.material && <span>Material · {p.material}</span>}
          </div>
        </div>

        {check ? <PriceCheck product={p} check={check} /> : <div className="skeleton" style={{ height: 320 }} />}

        <div className="panel" style={{ padding: 20 }}>
          <div className="stack" style={{ gap: 12 }}>
            <span className="eyebrow">Wear it to</span>
            {user && moments.length > 0 ? (
              <div className="row" style={{ gap: 10 }}>
                <select className="select grow" value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Moment">
                  {moments.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} · {shortDate(m.date)}
                    </option>
                  ))}
                </select>
                <button className="btn btn-primary" onClick={addToMoment} disabled={adding}>
                  <Icon name="plus" size={16} stroke={2} /> Add
                </button>
              </div>
            ) : (
              <div className="row between wrap" style={{ gap: 12 }}>
                <span className="small">{user ? 'Add a moment and style this into the look.' : 'Log in to style this into one of your moments.'}</span>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    onClose();
                    navigate(user ? '/moments?new=1' : '/login');
                  }}
                >
                  {user ? 'New moment' : 'Log in'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Drawer>
  );
}
