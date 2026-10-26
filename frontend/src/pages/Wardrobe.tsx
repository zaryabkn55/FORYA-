import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Overlay';
import { Photo } from '../components/Photo';
import { CapturePieceDialog } from '../components/CapturePieceDialog';
import { ProductCard } from '../components/ProductCard';
import { api } from '../lib/api';
import { priceCheckFor } from '../lib/catalogue';
import { longDate, money } from '../lib/format';
import { img, type ImageKey } from '../lib/imagery';
import { useStore } from '../lib/store';
import { canCapture } from '../lib/subjectLift';
import type { JournalEntry, Product } from '../lib/types';

type Tab = 'saved' | 'owned' | 'journal';

export default function Wardrobe() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) || 'saved';
  const { wardrobe, product, toast } = useStore();
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [logging, setLogging] = useState(false);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    api.journal().then(setJournal);
  }, []);

  const entries = (kind: 'saved' | 'owned') =>
    wardrobe
      .filter((w) => w.kind === kind)
      .map((w) => ({ w, p: product(w.productId) }))
      .filter((x): x is { w: typeof x.w; p: Product } => !!x.p);

  const saved = entries('saved');
  const owned = entries('owned');

  const stats = useMemo(() => {
    const value = owned.reduce((s, { p }) => s + p.price, 0);
    const wears = owned.reduce((s, { w }) => s + (w.timesWorn ?? 0), 0);
    const savedValue = saved.reduce((s, { p }) => s + p.price, 0);
    const savedBest = saved.reduce((s, { p }) => s + priceCheckFor(p).best.price, 0);
    return { value, wears, cpw: wears ? value / wears : 0, savedValue, savedBest };
  }, [owned, saved]);

  const setTab = (t: Tab) => setParams({ tab: t }, { replace: true });

  return (
    <div className="page">
      <div className="container stack" style={{ gap: 32 }}>
        <div className="wardrobe-hero">
          <Photo src={img('edBandWide')} alt="" className="wardrobe-hero-photo" eager position="50% 30%" />
          <div className="wardrobe-hero-copy">
            <span className="eyebrow">Wardrobe</span>
            <h1 className="h1">
              Everything you love, <span className="wink">in one place.</span>
            </h1>
            <div className="stat-row">
              <div>
                <span className="h3">{owned.length}</span>
                <span className="small">pieces owned</span>
              </div>
              <div>
                <span className="h3">{saved.length}</span>
                <span className="small">on your wishlist</span>
              </div>
              <div>
                <span className="h3">{stats.cpw ? money(Math.round(stats.cpw)) : '—'}</span>
                <span className="small">avg cost per wear</span>
              </div>
            </div>
          </div>
        </div>

        <div className="row between wrap" style={{ gap: 16 }}>
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'saved'} onClick={() => setTab('saved')}>
              Saved · {saved.length}
            </button>
            <button role="tab" aria-selected={tab === 'owned'} onClick={() => setTab('owned')}>
              Owned · {owned.length}
            </button>
            <button role="tab" aria-selected={tab === 'journal'} onClick={() => setTab('journal')}>
              Journal · {journal.length}
            </button>
          </div>
          {tab === 'journal' ? (
            <button className="btn btn-primary" onClick={() => setLogging(true)}>
              <Icon name="camera" size={18} /> Log a fit
            </button>
          ) : (
            <div className="row wrap" style={{ gap: 8 }}>
              {/* Photographing a piece is an app capability: it needs the camera and the
                  device's own subject lifting, neither of which the website has. */}
              {canCapture() && (
                <button className="btn btn-primary" onClick={() => setCapturing(true)}>
                  <Icon name="camera" size={18} /> Photograph a piece
                </button>
              )}
              <Link to="/discover" className="btn btn-quiet">
                <Icon name="plus" size={18} /> Add pieces
              </Link>
            </div>
          )}
        </div>

        {tab === 'saved' &&
          (saved.length ? (
            <>
              {stats.savedValue - stats.savedBest > 1 && (
                <div className="savings-banner">
                  <Icon name="tag" size={20} />
                  <span>
                    Your wishlist costs <strong>{money(stats.savedValue)}</strong> at full price, or <strong>{money(stats.savedBest)}</strong> at the best prices we found.
                  </span>
                </div>
              )}
              <div className="product-grid">
                {saved.map(({ p }) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </>
          ) : (
            <Empty title="Nothing saved" wink="yet." body="Tap the heart on anything in Discover and it'll wait for you here, price-checked." cta="Go to Discover" to="/discover" />
          ))}

        {tab === 'owned' &&
          (owned.length ? (
            <div className="product-grid">
              {owned.map(({ p, w }) => (
                <div key={p.id} className="stack" style={{ gap: 8 }}>
                  <ProductCard product={p} />
                  <span className="small row" style={{ gap: 6 }}>
                    <Icon name="hanger" size={14} /> Worn {w.timesWorn ?? 0} time{w.timesWorn === 1 ? '' : 's'}
                    {w.timesWorn ? ` · ${money(p.price / w.timesWorn)} a wear` : ''}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              title="Tell us what"
              wink="you've got."
              body="Mark pieces as “I own this” and we'll style them into your looks first. Cheaper, and better for the planet."
              cta="Find your pieces"
              to="/discover"
            />
          ))}

        {tab === 'journal' &&
          (journal.length ? (
            <div className="journal-grid">
              {journal.map((j) => (
                <article key={j.id} className="journal-card">
                  <Photo src={j.image} alt="" ratio="4 / 5" />
                  <span className="eyebrow">{longDate(j.date)}</span>
                  <span className="h4">{j.title}</span>
                  <span className="small">{j.note}</span>
                  {j.productIds.length > 0 && (
                    <div className="row" style={{ gap: 6, marginTop: 4 }}>
                      {j.productIds.map((id) => {
                        const p = product(id);
                        return p ? (
                          <span key={id} className="journal-chip" title={p.name}>
                            <img src={p.imageUrl} alt={p.name} />
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <Empty title="Your journal's" wink="empty." body="Log what you wore and how it felt. Future you will thank you." />
          ))}
      </div>

      {capturing && (
        <CapturePieceDialog
          onClose={() => setCapturing(false)}
          onAdded={(pieceName) => {
            toast(`${pieceName} is in your wardrobe.`, 'Nice one.');
            setParams({ tab: 'owned' });
          }}
        />
      )}

      {logging && (
        <LogFit
          owned={owned.map((o) => o.p)}
          onClose={() => setLogging(false)}
          onSaved={(e) => {
            setJournal((j) => [e, ...j]);
            setLogging(false);
          }}
        />
      )}
    </div>
  );
}

function Empty({ title, wink, body, cta, to }: { title: string; wink: string; body: string; cta?: string; to?: string }) {
  return (
    <div className="empty">
      <h3 className="h3">
        {title} <span className="wink">{wink}</span>
      </h3>
      <p className="body" style={{ maxWidth: 420 }}>
        {body}
      </p>
      {cta && to && (
        <Link to={to} className="btn btn-primary">
          {cta}
        </Link>
      )}
    </div>
  );
}

const COVERS: ImageKey[] = ['edJournalOne', 'edJournalTwo', 'edJournalThree', 'edCoffee', 'edDinner', 'edWeekend'];

function LogFit({ owned, onClose, onSaved }: { owned: Product[]; onClose: () => void; onSaved: (e: JournalEntry) => void }) {
  const { products, toast } = useStore();
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [cover, setCover] = useState<ImageKey>('edJournalOne');
  const [ids, setIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const pool = owned.length ? owned : products;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    const entry = await api.addJournal({ title: title.trim(), note: note.trim(), image: img(cover), date: new Date().toISOString(), productIds: ids });
    toast('Logged.', 'Looking good.');
    onSaved(entry);
  };

  return (
    <Modal title="Log a" wink="fit." onClose={onClose}>
      <form className="stack" style={{ gap: 18 }} onSubmit={submit}>
        <div className="field">
          <label className="label" htmlFor="j-title">
            Name it
          </label>
          <input id="j-title" className="input" placeholder="Sunday in linen" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus required />
        </div>
        <div className="field">
          <span className="label">Pick a cover</span>
          <div className="cover-grid">
            {COVERS.map((c) => (
              <button type="button" key={c} className={`cover ${cover === c ? 'is-active' : ''}`} onClick={() => setCover(c)} aria-pressed={cover === c}>
                <img src={img(c)} alt="" />
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <span className="label">What you wore</span>
          <div className="row wrap" style={{ gap: 8 }}>
            {pool.map((p) => {
              const on = ids.includes(p.id);
              return (
                <button type="button" key={p.id} className={`chip ${on ? 'is-active' : ''}`} onClick={() => setIds((s) => (on ? s.filter((x) => x !== p.id) : [...s, p.id]))}>
                  {p.brand} {p.category.toLowerCase()}
                </button>
              );
            })}
          </div>
        </div>
        <div className="field">
          <label className="label" htmlFor="j-note">
            How did it feel?
          </label>
          <textarea id="j-note" className="textarea" placeholder="Compliments, regrets, would wear again…" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="row" style={{ justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={busy || !title.trim()}>
            Save to journal
          </button>
        </div>
      </form>
    </Modal>
  );
}
