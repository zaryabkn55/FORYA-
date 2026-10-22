/** The look canvas for one moment: drag pieces in, arrange them, price the look, mark it ready. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { StatusChip, VerdictChip } from '../components/Bits';
import { Icon } from '../components/Icon';
import { BuyLink } from '../components/BuyLink';
import { Modal } from '../components/Overlay';
import { ShareDialog } from '../components/ShareDialog';
import { award } from '../lib/points';
import { useSession } from '../lib/session';
import { useProductDrawer } from '../components/ProductDrawer';
import { api } from '../lib/api';
import { bestNewPrice, priceCheckFor } from '../lib/catalogue';
import { longDate, money, relativeDay } from '../lib/format';
import { buildLook, placePiece, tidy } from '../lib/layout';
import { useStore } from '../lib/store';
import { CATEGORIES, type Category, type LookStatus, type Moment, type Piece, type Product } from '../lib/types';
import { uid } from '../lib/format';
import { lookCheck, lookNote, styleForMe } from '../lib/aiStylist';
import { AI_LABEL, type AiSource } from '../lib/ai';
import { momentScore, suitsWeather, weatherAdvice, weatherFit } from '../lib/stylist';
import { useStylistContext } from '../lib/useStylist';
import './canvas.css';

type Source = 'owned' | 'saved' | 'all';
type Save = 'saved' | 'saving' | 'error';

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const SNAP = 1.6;

export default function Canvas() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { products, product, wardrobe, kindOf, toast } = useStore();
  const drawer = useProductDrawer();

  const [moment, setMoment] = useState<Moment | null>(null);
  const [missing, setMissing] = useState(false);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [status, setStatus] = useState<LookStatus>('draft');
  const [selected, setSelected] = useState<string | null>(null);
  const [past, setPast] = useState<Piece[][]>([]);
  const [future, setFuture] = useState<Piece[][]>([]);
  const [save, setSave] = useState<Save>('saved');
  const [guide, setGuide] = useState<{ x?: number; y?: number }>({});
  const [source, setSource] = useState<Source>('all');
  const [cat, setCat] = useState<Category | 'All'>('All');
  const [q, setQ] = useState('');
  const [dropping, setDropping] = useState(false);
  const [weatherOn, setWeatherOn] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shopping, setShopping] = useState(false);
  const { user } = useSession();
  const [params, setParams] = useSearchParams();
  const { ctx } = useStylistContext(useMemo(() => [], []));
  const [styling, setStyling] = useState(false);
  const [styled, setStyled] = useState<{ note: string; source: AiSource; why: Record<string, string> } | null>(null);
  const [feedback, setFeedback] = useState<{ note: string; source: AiSource } | null>(null);
  const [asking, setAsking] = useState(false);
  const seed = useRef(Math.floor(Math.random() * 1000));

  const canvasRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<number>();
  const loaded = useRef(false);

  /* Load ---------------------------------------------------------------------------------- */
  useEffect(() => {
    loaded.current = false;
    api
      .moment(id)
      .then((m) => {
        setMoment(m);
        setPieces(m.look.pieces);
        setStatus(m.look.status);
        setPast([]);
        setFuture([]);
        loaded.current = true;
      })
      .catch(() => setMissing(true));
  }, [id]);

  /* Autosave ------------------------------------------------------------------------------ */
  const persist = useCallback(
    (next: Piece[], nextStatus: LookStatus) => {
      if (!loaded.current) return;
      setSave('saving');
      window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(async () => {
        try {
          await api.saveLook(id, { status: nextStatus, pieces: next });
          setSave('saved');
        } catch {
          setSave('error');
        }
      }, 500);
    },
    [id],
  );

  /** Every committed change goes through here: history, auto status, autosave. */
  const commit = useCallback(
    (next: Piece[], opts: { history?: boolean } = {}) => {
      if (opts.history !== false) {
        setPast((p) => [...p.slice(-49), pieces]);
        setFuture([]);
      }
      setPieces(next);
      const nextStatus: LookStatus = next.length === 0 ? 'draft' : status === 'draft' ? 'in-progress' : status;
      setStatus(nextStatus);
      persist(next, nextStatus);
    },
    [pieces, status, persist],
  );

  const setLookStatus = (s: LookStatus) => {
    setStatus(s);
    persist(pieces, s);
    if (s === 'ready') {
      const pts = award(user?.id, 'look-ready', id);
      toast('Look ready.', pts ? `+${pts} style points.` : 'You’re all set.');
    }
  };

  const undo = useCallback(() => {
    if (!past.length) return;
    setFuture((f) => [pieces, ...f]);
    const prev = past[past.length - 1];
    setPast((p) => p.slice(0, -1));
    commit(prev, { history: false });
  }, [past, pieces, commit]);

  const redo = useCallback(() => {
    if (!future.length) return;
    setPast((p) => [...p, pieces]);
    const [next, ...rest] = future;
    setFuture(rest);
    commit(next, { history: false });
  }, [future, pieces, commit]);

  /* Piece operations ---------------------------------------------------------------------- */
  const add = useCallback(
    (p: Product, at?: { x: number; y: number }) => {
      const piece = placePiece(p, pieces, at);
      commit([...pieces, piece]);
      setSelected(piece.id);
    },
    [pieces, commit],
  );

  const update = (pid: string, patch: Partial<Piece>) => setPieces((ps) => ps.map((p) => (p.id === pid ? { ...p, ...patch } : p)));

  const remove = useCallback(
    (pid: string) => {
      commit(pieces.filter((p) => p.id !== pid));
      setSelected(null);
    },
    [pieces, commit],
  );

  const duplicate = useCallback(
    (pid: string) => {
      const src = pieces.find((p) => p.id === pid);
      if (!src) return;
      const copy = { ...src, id: uid('pc'), x: clamp(src.x + 6, 5, 95), y: clamp(src.y + 6, 5, 95), z: Math.max(...pieces.map((p) => p.z)) + 1 };
      commit([...pieces, copy]);
      setSelected(copy.id);
    },
    [pieces, commit],
  );

  const restack = useCallback(
    (pid: string, dir: 'front' | 'back') => {
      const zs = pieces.map((p) => p.z);
      const z = dir === 'front' ? Math.max(...zs) + 1 : Math.min(...zs) - 1;
      commit(pieces.map((p) => (p.id === pid ? { ...p, z } : p)));
    },
    [pieces, commit],
  );

  const tidyUp = () => {
    commit(tidy(pieces, product));
    toast('Tidied.', 'Much better.');
  };

  /* Pointer: move & resize ---------------------------------------------------------------- */
  const startMove = (e: React.PointerEvent, piece: Piece) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    setSelected(piece.id);
    const rect = canvasRef.current!.getBoundingClientRect();
    const start = { x: e.clientX, y: e.clientY, px: piece.x, py: piece.y };
    let moved = false;
    let last = { x: piece.x, y: piece.y };
    const onMove = (ev: PointerEvent) => {
      const dx = ((ev.clientX - start.x) / rect.width) * 100;
      const dy = ((ev.clientY - start.y) / rect.height) * 100;
      if (Math.abs(dx) + Math.abs(dy) > 0.4) moved = true;
      let x = clamp(start.px + dx, 4, 96);
      let y = clamp(start.py + dy, 4, 96);
      const g: { x?: number; y?: number } = {};
      if (Math.abs(x - 50) < SNAP) (x = 50), (g.x = 50);
      if (Math.abs(y - 50) < SNAP) (y = 50), (g.y = 50);
      for (const o of pieces) {
        if (o.id === piece.id) continue;
        if (g.x === undefined && Math.abs(x - o.x) < SNAP) (x = o.x), (g.x = o.x);
        if (g.y === undefined && Math.abs(y - o.y) < SNAP) (y = o.y), (g.y = o.y);
      }
      setGuide(g);
      last = { x, y };
      update(piece.id, last);
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      setGuide({});
      if (moved) {
        const next = pieces.map((p) => (p.id === piece.id ? { ...p, ...last } : p));
        setPast((p) => [...p.slice(-49), pieces]);
        setFuture([]);
        setPieces(next);
        persist(next, status);
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const startResize = (e: React.PointerEvent, piece: Piece) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = canvasRef.current!.getBoundingClientRect();
    const startX = e.clientX;
    let w = piece.w;
    const onMove = (ev: PointerEvent) => {
      w = clamp(piece.w + ((ev.clientX - startX) / rect.width) * 200, 8, 70);
      update(piece.id, { w });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      const next = pieces.map((p) => (p.id === piece.id ? { ...p, w } : p));
      setPast((p) => [...p.slice(-49), pieces]);
      setFuture([]);
      setPieces(next);
      persist(next, status);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  /* Drop from the panel ------------------------------------------------------------------- */
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDropping(false);
    const p = product(e.dataTransfer.getData('text/forya-product'));
    if (!p) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    add(p, { x: clamp(((e.clientX - rect.left) / rect.width) * 100, 6, 94), y: clamp(((e.clientY - rect.top) / rect.height) * 100, 6, 94) });
  };

  /* Keyboard ------------------------------------------------------------------------------ */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, select, [role="dialog"]')) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        return e.shiftKey ? redo() : undo();
      }
      if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        return redo();
      }
      if (!selected) return;
      const piece = pieces.find((p) => p.id === selected);
      if (!piece) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        remove(selected);
      } else if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicate(selected);
      } else if (e.key === ']') restack(selected, 'front');
      else if (e.key === '[') restack(selected, 'back');
      else if (e.key === 'Escape') setSelected(null);
      else if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        const step = e.shiftKey ? 5 : 1;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        commit(pieces.map((p) => (p.id === selected ? { ...p, x: clamp(p.x + dx, 4, 96), y: clamp(p.y + dy, 4, 96) } : p)));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, pieces, undo, redo, remove, duplicate, restack, commit]);

  // Flush a pending save when leaving the page.
  useEffect(() => () => window.clearTimeout(saveTimer.current), []);

  /* Derived ------------------------------------------------------------------------------- */
  /* AI stylist -------------------------------------------------------------------------- */
  const styleIt = async () => {
    if (!moment || styling) return;
    setStyling(true);
    setFeedback(null);
    try {
      // Restyle should feel different: if a seed lands on the look that's already on the canvas, try again.
      const onCanvasNow = new Set(pieces.map((pc) => pc.productId));
      const current = [...onCanvasNow].sort().join('|');
      let look = null as Awaited<ReturnType<typeof styleForMe>> | null;
      for (let attempt = 0; attempt < 3; attempt++) {
        seed.current += 1;
        look = await styleForMe(moment, ctx, { seed: seed.current, avoid: attempt ? onCanvasNow : undefined });
        if (look.pieces.map((pc) => pc.id).sort().join('|') !== current) break;
      }
      if (!look) return;
      commit(buildLook(look.pieces));
      setStyled({ note: look.note, source: look.source, why: look.why });
      toast('Styled for you.', `${look.pieces.length} pieces. ⌘Z to undo.`);
    } catch {
      toast('The stylist is busy. Try again in a moment.');
    } finally {
      setStyling(false);
    }
  };

  // Arriving from the stylist chat with ?style=1: style an empty canvas straight away.
  const autoStyled = useRef(false);
  useEffect(() => {
    if (!moment || autoStyled.current || params.get('style') !== '1' || !ctx.products.length) return;
    autoStyled.current = true;
    params.delete('style');
    setParams(params, { replace: true });
    if (!pieces.length) styleIt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moment, ctx.products.length]);

  const lookProducts = useMemo(() => {
    const seen = new Set<string>();
    return pieces.map((pc) => product(pc.productId)).filter((p): p is Product => !!p && !seen.has(p.id) && !!seen.add(p.id));
  }, [pieces, product]);
  const check = useMemo(() => (moment && lookProducts.length ? lookCheck(lookProducts, moment, ctx) : null), [lookProducts, moment, ctx]);

  const swapIn = (inP: Product, outP?: Product) => {
    const old = outP && pieces.find((pc) => pc.productId === outP.id);
    if (old) commit(pieces.map((pc) => (pc.id === old.id ? { ...pc, productId: inP.id, id: uid('pc') } : pc)));
    else commit([...pieces, placePiece(inP, pieces)]);
    setFeedback(null);
    toast(outP ? `Swapped in the ${inP.name.toLowerCase()}.` : `Added the ${inP.name.toLowerCase()}.`);
  };

  const askFeedback = async () => {
    if (!moment || !check) return;
    setAsking(true);
    try {
      setFeedback(await lookNote(lookProducts, moment, check, ctx));
    } catch {
      /* cancelled */
    } finally {
      setAsking(false);
    }
  };

  const onCanvas = useMemo(() => new Set(pieces.map((p) => p.productId)), [pieces]);

  const shelf = useMemo(() => {
    const ids = new Set(wardrobe.filter((w) => source === 'all' || w.kind === source).map((w) => w.productId));
    const needle = q.trim().toLowerCase();
    const out = products
      .filter((p) => source === 'all' || ids.has(p.id))
      // Shopping new pieces: only what the stylist engine rates for this moment's forecast. Your own pieces always show.
      .filter((p) => source !== 'all' || !weatherOn || suitsWeather(p, moment?.weather))
      .filter((p) => cat === 'All' || p.category === cat)
      .filter((p) => !needle || `${p.brand} ${p.name} ${p.colorName}`.toLowerCase().includes(needle));
    if (!moment || source !== 'all') return out;
    const score = new Map(out.map((p) => [p.id, momentScore(p, moment).score]));
    return out.sort((a, b) => score.get(b.id)! - score.get(a.id)!);
  }, [products, wardrobe, source, cat, q, weatherOn, moment]);

  const list = useMemo(() => {
    const seen = new Set<string>();
    return [...pieces]
      .sort((a, b) => a.y - b.y)
      .map((pc) => product(pc.productId))
      .filter((p): p is Product => !!p && !seen.has(p.id) && !!seen.add(p.id))
      .map((p) => {
        const check = priceCheckFor(p);
        const owned = kindOf(p.id) === 'owned';
        return { p, check, owned, best: Math.min(p.price, bestNewPrice(check)) };
      });
  }, [pieces, product, kindOf]);

  const toBuy = list.filter((l) => !l.owned);
  const total = toBuy.reduce((s, l) => s + l.p.price, 0);
  const bestTotal = toBuy.reduce((s, l) => s + l.best, 0);
  const sel = pieces.find((p) => p.id === selected);
  const selProduct = sel ? product(sel.productId) : undefined;

  /* Render -------------------------------------------------------------------------------- */
  if (missing)
    return (
      <div className="page container">
        <div className="empty">
          <h3 className="h3">
            This moment's <span className="wink">moved on.</span>
          </h3>
          <p className="body">It may have been deleted. Your other moments are safe.</p>
          <Link to="/moments" className="btn btn-primary">
            Back to moments
          </Link>
        </div>
      </div>
    );

  if (!moment)
    return (
      <div className="page container">
        <div className="skeleton" style={{ height: 640 }} />
      </div>
    );

  return (
    <div className="studio">
      {/* Header */}
      <div className="studio-head container">
        <div className="row" style={{ gap: 14, minWidth: 0 }}>
          <Link to="/moments" className="icon-btn" aria-label="Back to moments">
            <Icon name="arrowLeft" size={18} />
          </Link>
          <div className="stack" style={{ gap: 2, minWidth: 0 }}>
            <div className="row" style={{ gap: 10 }}>
              <h1 className="h3" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {moment.title}
              </h1>
              <StatusChip status={status} />
            </div>
            <div className="row wrap small" style={{ gap: 12 }}>
              <span>
                {longDate(moment.date)}
                {!relativeDay(moment.date).startsWith('This') && ` · ${relativeDay(moment.date)}`}
              </span>
              {moment.venue && <span className="hide-mobile">{moment.venue}</span>}
              {moment.weather && (
                <span className="row" style={{ gap: 4 }}>
                  <Icon name={moment.weather.condition.includes('Clear') ? 'sun' : 'cloud'} size={14} /> {moment.weather.temperature}°
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <span className="small save-state hide-mobile">{save === 'saving' ? 'Saving…' : save === 'error' ? 'Couldn’t save. Retrying on next change.' : 'All changes saved'}</span>
          <button className="btn btn-quiet" onClick={() => setSharing(true)} disabled={!pieces.length}>
            <Icon name="share" size={17} /> Share
          </button>
          <button className="icon-btn" onClick={() => setConfirmDelete(true)} aria-label="Delete moment" title="Delete moment">
            <Icon name="trash" size={18} />
          </button>
          {status === 'ready' ? (
            <button className="btn btn-quiet" onClick={() => setLookStatus('in-progress')}>
              Keep editing
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => setLookStatus('ready')} disabled={!pieces.length}>
              <Icon name="check" size={18} stroke={2} /> Mark ready
            </button>
          )}
        </div>
      </div>

      <div className="studio-grid container">
        {/* Shelf */}
        <aside className="shelf">
          <div className="tabs" role="tablist" style={{ width: '100%' }}>
            {(['all', 'owned', 'saved'] as Source[]).map((s) => (
              <button key={s} role="tab" aria-selected={source === s} onClick={() => setSource(s)} style={{ flex: 1 }}>
                {s === 'all' ? 'Shop' : s === 'owned' ? 'Wardrobe' : 'Saved'}
              </button>
            ))}
          </div>
          <div className="input-icon">
            <Icon name="search" size={17} />
            <input className="input" style={{ height: 44 }} placeholder="Search pieces" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="scroll-x" style={{ gap: 6 }}>
            {(['All', ...CATEGORIES] as const).map((c) => (
              <button key={c} className={`chip ${cat === c ? 'is-active' : ''}`} style={{ height: 32, padding: '0 12px', fontSize: 13 }} onClick={() => setCat(c)}>
                {c}
              </button>
            ))}
          </div>
          <div className="shelf-grid">
            {shelf.map((p) => (
              <button
                key={p.id}
                className={`shelf-item ${onCanvas.has(p.id) ? 'is-on' : ''}`}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/forya-product', p.id);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                onClick={() => add(p)}
                title={`Add ${p.name}`}
              >
                <span className="shelf-media">
                  <img src={p.imageUrl} alt="" draggable={false} />
                  {onCanvas.has(p.id) && (
                    <span className="shelf-check">
                      <Icon name="check" size={13} stroke={2.2} />
                    </span>
                  )}
                </span>
                <span className="brand-label" style={{ fontSize: 9.5 }}>
                  {p.brand}
                </span>
                <span className="shelf-name">{p.name}</span>
                <span className="price small" style={{ color: 'var(--ink)' }}>
                  {money(p.price)}
                </span>
              </button>
            ))}
            {shelf.length === 0 && (
              <p className="small" style={{ gridColumn: '1 / -1', padding: 12 }}>
                {source === 'owned' ? 'Mark pieces as “I own this” and they’ll live here.' : source === 'saved' ? 'Save pieces in Discover to style them here.' : 'No pieces match.'}
              </p>
            )}
          </div>
          {source === 'all' && moment.weather && (
            <label className="switch" style={{ marginLeft: 0, fontSize: 13 }}>
              <input type="checkbox" checked={weatherOn} onChange={(e) => setWeatherOn(e.target.checked)} />
              <span>
                <Icon name="sparkle" size={12} /> AI weather match for {moment.weather.temperature}°
              </span>
            </label>
          )}
          <Link to={`/discover?moment=${moment.id}`} className="small" style={{ fontWeight: 600, color: 'var(--ink)' }}>
            Shop all brands for this moment →
          </Link>
          <p className="small hide-mobile" style={{ margin: 0 }}>
            Drag onto the canvas, or tap to drop it in place.
          </p>
        </aside>

        {/* Canvas */}
        <section className="board-wrap">
          <div className="board-tools">
            <div className="row" style={{ gap: 6 }}>
              <button className="icon-btn icon-btn-sm" onClick={undo} disabled={!past.length} aria-label="Undo" title="Undo (⌘Z)">
                <Icon name="undo" size={17} />
              </button>
              <button className="icon-btn icon-btn-sm" onClick={redo} disabled={!future.length} aria-label="Redo" title="Redo (⇧⌘Z)">
                <Icon name="redo" size={17} />
              </button>
            </div>
            {sel && selProduct ? (
              <div className="row" style={{ gap: 6 }}>
                <span className="small hide-mobile" style={{ marginRight: 4 }}>
                  {selProduct.brand}
                </span>
                <button className="icon-btn icon-btn-sm" onClick={() => restack(sel.id, 'front')} aria-label="Bring to front" title="Bring to front (])">
                  <Icon name="front" size={17} />
                </button>
                <button className="icon-btn icon-btn-sm" onClick={() => restack(sel.id, 'back')} aria-label="Send to back" title="Send to back ([)">
                  <Icon name="back" size={17} />
                </button>
                <button className="icon-btn icon-btn-sm" onClick={() => duplicate(sel.id)} aria-label="Duplicate" title="Duplicate (⌘D)">
                  <Icon name="copy" size={17} />
                </button>
                <button className="icon-btn icon-btn-sm" onClick={() => drawer.open(selProduct.id)} aria-label="Details" title="Details & prices">
                  <Icon name="tag" size={17} />
                </button>
                <button className="icon-btn icon-btn-sm" onClick={() => remove(sel.id)} aria-label="Remove" title="Remove (Delete)">
                  <Icon name="trash" size={17} />
                </button>
              </div>
            ) : (
              <div className="row" style={{ gap: 6 }}>
                <button className="btn btn-quiet btn-sm" onClick={tidyUp} disabled={pieces.length < 2}>
                  <Icon name="layers" size={16} /> Tidy up
                </button>
                <button className="btn btn-ai btn-sm" onClick={styleIt} disabled={styling}>
                  <Icon name="sparkle" size={16} /> {styling ? 'Styling…' : pieces.length ? 'Restyle it' : 'Style it for me'}
                </button>
              </div>
            )}
          </div>

          <div
            ref={canvasRef}
            className={`board ${dropping ? 'is-dropping' : ''}`}
            onPointerDown={() => setSelected(null)}
            onDragOver={(e) => {
              e.preventDefault();
              setDropping(true);
            }}
            onDragLeave={() => setDropping(false)}
            onDrop={onDrop}
          >
            <span className="hand board-title">{moment.title}.</span>
            {guide.x !== undefined && <span className="guide guide-v" style={{ left: `${guide.x}%` }} />}
            {guide.y !== undefined && <span className="guide guide-h" style={{ top: `${guide.y}%` }} />}

            {pieces.length === 0 && (
              <div className="board-empty">
                <span className="hand" style={{ fontSize: 34 }}>
                  Drop pieces here
                </span>
                <span className="small">Start with something you own, it's free.</span>
                <button className="btn btn-ai btn-sm" style={{ marginTop: 10, pointerEvents: 'auto' }} onPointerDown={(e) => e.stopPropagation()} onClick={styleIt} disabled={styling}>
                  <Icon name="sparkle" size={16} /> {styling ? 'Styling…' : 'Or let FORYA style it'}
                </button>
              </div>
            )}

            {[...pieces]
              .sort((a, b) => a.z - b.z)
              .map((pc) => {
                const p = product(pc.productId);
                if (!p) return null;
                const isSel = pc.id === selected;
                return (
                  <div
                    key={pc.id}
                    className={`piece ${isSel ? 'is-selected' : ''}`}
                    style={{ left: `${pc.x}%`, top: `${pc.y}%`, width: `${pc.w}%`, zIndex: pc.z + 10 }}
                    onPointerDown={(e) => startMove(e, pc)}
                    onDoubleClick={() => drawer.open(p.id)}
                    tabIndex={0}
                    onFocus={() => setSelected(pc.id)}
                    aria-label={p.name}
                  >
                    <img src={p.imageUrl} alt={p.name} draggable={false} />
                    {isSel && (
                      <>
                        <span className="piece-handle" onPointerDown={(e) => startResize(e, pc)} aria-hidden />
                        <span className={`hand piece-label ${pc.x > 60 ? 'is-left' : ''}`}>
                          {kindOf(p.id) === 'owned' ? 'yours already' : money(p.price)}
                        </span>
                      </>
                    )}
                  </div>
                );
              })}
          </div>
          <p className="small hide-mobile" style={{ textAlign: 'center', margin: 0 }}>
            Drag to move · corner to resize · arrows to nudge · [ ] to layer · ⌘Z to undo
          </p>
        </section>

        {/* The look */}
        <aside className="look-panel">
          <div className="stack" style={{ gap: 4 }}>
            <span className="eyebrow">The look</span>
            <h2 className="h3">
              {list.length ? `${list.length} piece${list.length === 1 ? '' : 's'}` : 'Nothing yet'}
            </h2>
          </div>

          {moment.weather && (
            <div className="weather-tip">
              <Icon name={moment.weather.condition.includes('Clear') ? 'sun' : 'cloud'} size={18} />
              <span>
                {moment.weather.temperature}° and {moment.weather.condition.toLowerCase()}. {weatherAdvice(moment.weather, ctx.shopsFor)}
              </span>
            </div>
          )}

          {styled && pieces.length > 0 && (
            <div className="ai-note">
              <span className="eyebrow">
                <Icon name="sparkle" size={12} /> Stylist's note · {AI_LABEL[styled.source]}
              </span>
              <p>{styled.note}</p>
            </div>
          )}

          {check && (
            <div className="look-check">
              <div className="row between">
                <div className="stack" style={{ gap: 0 }}>
                  <span className="eyebrow">
                    <Icon name="sparkle" size={12} /> Look check
                  </span>
                  <span className="h4">{check.grade}</span>
                </div>
                <span className="score-ring" style={{ ['--p' as string]: check.score }} aria-label={`Score ${check.score} out of 100`}>
                  {check.score}
                </span>
              </div>
              <ul className="checks">
                {check.checks.map((c) => (
                  <li key={c.label} className={c.ok ? 'ok' : 'warn'}>
                    <Icon name={c.ok ? 'check' : 'info'} size={14} stroke={2} />
                    <span>
                      <strong>{c.label}.</strong> {c.detail}
                    </span>
                  </li>
                ))}
              </ul>
              {check.swaps.map((sw) => (
                <div key={sw.in.id} className="swap">
                  <span className="look-thumb" style={{ width: 40, height: 48 }}>
                    <img src={sw.in.imageUrl} alt="" />
                  </span>
                  <span className="grow stack" style={{ gap: 0, minWidth: 0 }}>
                    <span className="look-name" style={{ fontSize: 13 }}>
                      {sw.out ? 'Swap for ' : 'Add '}
                      {sw.in.brand} {sw.in.name.toLowerCase()}
                    </span>
                    <span className="small">{sw.reason}</span>
                  </span>
                  <button className="btn btn-quiet btn-sm" onClick={() => swapIn(sw.in, sw.out)}>
                    {sw.out ? 'Swap' : 'Add'}
                  </button>
                </div>
              ))}
              {feedback ? (
                <p className="small ai-feedback">
                  <strong>{AI_LABEL[feedback.source]}:</strong> {feedback.note}
                </p>
              ) : (
                <button className="link small" style={{ alignSelf: 'flex-start' }} onClick={askFeedback} disabled={asking}>
                  {asking ? 'Thinking…' : 'Get the stylist’s honest opinion'}
                </button>
              )}
            </div>
          )}

          <div className="look-items">
            {list.map(({ p, check, owned }) => (
              <button key={p.id} className="look-item" onClick={() => drawer.open(p.id)}>
                <span className="look-thumb">
                  <img src={p.imageUrl} alt="" />
                </span>
                <span className="grow stack" style={{ gap: 2, textAlign: 'left', minWidth: 0 }}>
                  <span className="brand-label" style={{ fontSize: 9.5 }}>
                    {p.brand}
                  </span>
                  <span className="look-name">{p.name}</span>
                  {moment.weather && <span className="fit-reason">{styled?.why[p.id] ?? weatherFit(p, moment.weather).reason}</span>}
                  {owned ? <span className="small">In your wardrobe</span> : <VerdictChip verdict={check.verdict} small />}
                </span>
                <span className="price" style={{ fontSize: 14, textDecoration: owned ? 'line-through' : undefined, color: owned ? 'var(--stone)' : undefined }}>
                  {money(p.price)}
                </span>
              </button>
            ))}
          </div>

          {list.length > 0 && (
            <div className="look-sum">
              <div className="row between">
                <span className="small">To buy</span>
                <span className="price">{money(total)}</span>
              </div>
              <div className="row between">
                <span className="small">At the best prices</span>
                <span className="price" style={{ fontSize: 20 }}>
                  {money(bestTotal)}
                </span>
              </div>
              {total - bestTotal > 1 && (
                <div className="row" style={{ gap: 8, padding: '10px 12px', borderRadius: 12, background: 'var(--good-bg)', color: 'var(--good)', fontSize: 14, fontWeight: 600 }}>
                  <Icon name="tag" size={16} /> Save {money(total - bestTotal)} on this look
                </div>
              )}
              {list.length - toBuy.length > 0 && (
                <span className="small">
                  {list.length - toBuy.length} piece{list.length - toBuy.length === 1 ? '' : 's'} already in your wardrobe.
                </span>
              )}
              {toBuy[0] && (
                <button className="btn btn-primary btn-block" onClick={() => setShopping(true)}>
                  <Icon name="bag" size={18} /> Shop the look
                </button>
              )}
            </div>
          )}
        </aside>
      </div>

      {sharing && <ShareDialog moment={{ ...moment, look: { status, pieces } }} onClose={() => setSharing(false)} />}

      {shopping && (
        <Modal title="Shop the" wink="look." onClose={() => setShopping(false)} width={560}>
          <p className="body" style={{ marginBottom: 18 }}>
            Each piece opens on the brand's own site. Prices may differ from the ones shown here.
          </p>
          <div className="stack" style={{ gap: 4 }}>
            {toBuy.map(({ p, best }) => (
              <div key={p.id} className="look-item" style={{ cursor: 'default' }}>
                <span className="look-thumb">
                  <img src={p.imageUrl} alt="" />
                </span>
                <span className="grow stack" style={{ gap: 2, minWidth: 0 }}>
                  <span className="brand-label" style={{ fontSize: 9.5 }}>
                    {p.brand}
                  </span>
                  <span className="look-name">{p.name}</span>
                  <span className="small">
                    {money(p.price)}
                    {best < p.price ? ` · from ${money(best)} elsewhere` : ''}
                  </span>
                </span>
                <BuyLink product={p} className="btn btn-primary btn-sm">
                  Buy at {p.brand} <Icon name="arrowUpRight" size={14} />
                </BuyLink>
              </div>
            ))}
          </div>
          {list.length > toBuy.length && <p className="small" style={{ marginTop: 14 }}>Pieces already in your wardrobe are left out.</p>}
        </Modal>
      )}

      {confirmDelete && (
        <Modal title="Delete this" wink="moment?" onClose={() => setConfirmDelete(false)} width={460}>
          <p className="body" style={{ marginBottom: 24 }}>
            {moment.title} and its look will be gone for good. Your saved and owned pieces stay put.
          </p>
          <div className="row" style={{ justifyContent: 'flex-end', gap: 10 }}>
            <button className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>
              Keep it
            </button>
            <button
              className="btn btn-primary"
              onClick={async () => {
                await api.deleteMoment(moment.id).catch(() => null);
                toast(`${moment.title} deleted`);
                navigate('/moments');
              }}
            >
              Delete moment
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
