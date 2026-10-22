import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LookPreview, SectionHead, StatusChip, VerdictChip } from '../components/Bits';
import { Icon } from '../components/Icon';
import { MomentArt } from '../components/MomentArt';
import { MomentCard } from '../components/MomentCard';
import { Photo } from '../components/Photo';
import { PointsChip } from '../components/PointsChip';
import { ProductCard } from '../components/ProductCard';
import { useProductDrawer } from '../components/ProductDrawer';
import { api } from '../lib/api';
import { priceCheckFor } from '../lib/catalogue';
import { countdown, daysUntil, greeting, longDate, money, momentHeadline, relativeDay, shortDate } from '../lib/format';
import { momentArt } from '../lib/momentArt';
import { useSession } from '../lib/session';
import { useReveal } from '../lib/useReveal';
import { useStore } from '../lib/store';
import type { JournalEntry, Moment } from '../lib/types';
import { topPicks, weatherAdvice } from '../lib/stylist';

export default function Dashboard() {
  const { user } = useSession();
  const { products, wardrobe, product, department } = useStore();
  const drawer = useProductDrawer();
  const navigate = useNavigate();
  const [moments, setMoments] = useState<Moment[] | null>(null);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  useReveal([moments, journal]);

  useEffect(() => {
    api.moments().then(setMoments).catch(() => setMoments([]));
    api.journal().then(setJournal);
  }, []);

  const upcoming = useMemo(() => (moments ?? []).filter((m) => daysUntil(m.date) >= 0), [moments]);
  const next = upcoming[0];
  const nextProducts = next ? next.look.pieces.map((pc) => product(pc.productId)).filter(Boolean) : [];
  const nextTotal = nextProducts.reduce((s, p) => s + p!.price, 0);
  const needsLook = upcoming.filter((m) => m.look.status !== 'ready').length;

  const saved = wardrobe.filter((w) => w.kind === 'saved').map((w) => product(w.productId)).filter(Boolean);
  const watch = saved.map((p) => ({ p: p!, check: priceCheckFor(p!) })).sort((a, b) => order(a.check.verdict) - order(b.check.verdict));

  // "Picked for ya": the stylist engine's best pieces for your next moment's weather and occasion,
  // leaving out what you already own or saved.
  const picks = useMemo(() => {
    const known = new Set(wardrobe.map((w) => w.productId));
    return topPicks(products, next ? { occasion: next.occasion, weather: next.weather } : undefined, 4, known);
  }, [products, wardrobe, next]);

  return (
    <div className="page">
      <div className="container stack" style={{ gap: 56 }}>
        {/* Greeting */}
        <div className="row between wrap" style={{ gap: 20, alignItems: 'flex-end' }}>
          <div className="stack" style={{ gap: 8 }}>
            <span className="eyebrow">{longDate(new Date().toISOString())}</span>
            <h1 className="h1">
              {greeting(user?.name).replace(/\.$/, '')}
              <span className="wink">.</span>
            </h1>
            <p className="body">
              {moments === null
                ? 'Getting your week together…'
                : upcoming.length === 0
                  ? 'Nothing on the calendar. Suspiciously calm.'
                  : `${upcoming.length} moment${upcoming.length === 1 ? '' : 's'} coming up${needsLook ? `, ${needsLook} still need${needsLook === 1 ? 's' : ''} a look` : ', all styled'}.`}
            </p>
          </div>
          <div className="row wrap" style={{ gap: 10 }}>
            <PointsChip />
            <Link to="/discover" className="btn btn-quiet">
              <Icon name="search" size={18} /> Discover
            </Link>
            <button className="btn btn-primary" onClick={() => navigate('/moments?new=1')}>
              <Icon name="plus" size={18} stroke={2} /> New moment
            </button>
          </div>
        </div>

        {/* Up next */}
        {moments === null ? (
          <div className="skeleton" style={{ height: 460 }} />
        ) : next ? (
          <section className="upnext">
            <UpNextArt moment={next} />
            <div className="upnext-look">
              <div className="row between">
                <span className="eyebrow">The look</span>
                <StatusChip status={next.look.status} />
              </div>
              <LookPreview look={next.look} empty="Blank canvas. Let's go." />
              <div className="row between">
                <span className="small">
                  {nextProducts.length} piece{nextProducts.length === 1 ? '' : 's'}
                  {nextTotal ? ` · ${money(nextTotal)}` : ''}
                </span>
                <Link to={`/moments/${next.id}`} className="btn btn-primary btn-sm">
                  {next.look.status === 'draft' ? 'Start styling' : 'Keep styling'} <Icon name="arrowRight" size={16} />
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <div className="empty">
            <h3 className="h3">
              What's the <span className="wink">plan?</span>
            </h3>
            <p className="body">Add a wedding, an interview, a weekend away. We'll take it from there.</p>
            <button className="btn btn-primary" onClick={() => navigate('/moments?new=1')}>
              Add your first moment
            </button>
          </div>
        )}

        {/* Coming up */}
        {upcoming.length > 1 && (
          <section>
            <SectionHead
              title="Coming up"
              action={
                <Link to="/moments" className="btn btn-quiet btn-sm">
                  All moments <Icon name="arrowRight" size={16} />
                </Link>
              }
            />
            <div className="moment-grid" data-reveal-stagger>
              {upcoming.slice(1, 5).map((m) => (
                <MomentCard key={m.id} moment={m} />
              ))}
            </div>
          </section>
        )}

        {/* Price watch */}
        <section className="watch" data-reveal>
          <div className="stack" style={{ gap: 12 }}>
            <span className="eyebrow">Price watch</span>
            <h2 className="h2">
              Your saved pieces, <span className="wink">checked.</span>
            </h2>
            <p className="body">We keep an eye on everything you save and tell you when the price is right.</p>
            <Link to="/wardrobe" className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start', marginTop: 8 }}>
              See saved pieces
            </Link>
          </div>
          <div className="watch-list">
            {watch.length === 0 && <p className="body">Save a piece in Discover and it'll show up here with a price verdict.</p>}
            {watch.slice(0, 4).map(({ p, check }) => (
              <button key={p.id} className="watch-row" onClick={() => drawer.open(p.id)}>
                <span className="watch-thumb">
                  <img src={p.imageUrl} alt="" />
                </span>
                <span className="grow stack" style={{ gap: 2, textAlign: 'left' }}>
                  <span className="brand-label">{p.brand}</span>
                  <span className="h4" style={{ fontSize: 15 }}>
                    {p.name}
                  </span>
                </span>
                <span className="stack hide-mobile" style={{ gap: 4, alignItems: 'flex-end' }}>
                  <VerdictChip verdict={check.verdict} small />
                  <span className="small">
                    Best {money(check.best.price)} · {check.best.retailer}
                  </span>
                </span>
                <Icon name="chevronRight" size={18} />
              </button>
            ))}
          </div>
        </section>

        {/* Picks */}
        <section>
          <SectionHead
            title="Picked"
            wink="for ya."
            action={
              <Link to={next ? `/discover?moment=${next.id}` : '/discover'} className="btn btn-quiet btn-sm">
                Discover more <Icon name="arrowRight" size={16} />
              </Link>
            }
          />
          {next?.weather && (
            <div className="ai-brief">
              <span className="stylist-mark">
                <Icon name="sparkle" size={16} />
              </span>
              <div className="stack grow" style={{ gap: 4 }}>
                <span className="eyebrow">
                  Stylist brief · {next.title}, {next.weather.temperature}° {next.weather.condition.toLowerCase()}
                </span>
                <p className="body" style={{ margin: 0 }}>
                  {weatherAdvice(next.weather, department)}
                </p>
              </div>
              <button className="btn btn-quiet btn-sm" onClick={() => window.dispatchEvent(new CustomEvent('forya:ask', { detail: `Dress me for ${next.title}` }))}>
                Ask FORYA
              </button>
            </div>
          )}
          <div className="product-grid">
            {picks.map((r) => (
              <ProductCard key={r.p.id} product={r.p} fit={next?.weather ? r.fit : undefined} />
            ))}
          </div>
        </section>

        {/* Journal */}
        {journal.length > 0 && (
          <section>
            <SectionHead
              title="From your"
              wink="journal."
              action={
                <Link to="/wardrobe?tab=journal" className="btn btn-quiet btn-sm">
                  Open journal <Icon name="arrowRight" size={16} />
                </Link>
              }
            />
            <div className="journal-grid" data-reveal-stagger>
              {journal.slice(0, 3).map((j) => (
                <Link to="/wardrobe?tab=journal" key={j.id} className="journal-card">
                  <Photo src={j.image} alt="" ratio="4 / 3" zoom />
                  <span className="eyebrow">{shortDate(j.date)}</span>
                  <span className="h4">{j.title}</span>
                  <span className="small">{j.note}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

const order = (v: string) => (v === 'good' ? 0 : v === 'typical' ? 1 : 2);

/** The hero panel for the next moment: drawn from its forecast and occasion, never photographed. */
function UpNextArt({ moment }: { moment: Moment }) {
  const art = momentArt(moment);
  return (
    <MomentArt art={art} className="upnext-art">
      <div className="upnext-overlay">
        <div className="m-art-top">
          <span className="m-art-count">
            <span className="m-art-count-value">{countdown(moment.date).value}</span>
            {countdown(moment.date).unit && <span className="m-art-count-unit">{countdown(moment.date).unit}</span>}
          </span>
          <span className="badge badge-white">{relativeDay(moment.date)}</span>
        </div>
        <div className="stack" style={{ gap: 8 }}>
          <span className="eyebrow">Up next · {moment.occasion}</span>
          <h2 className="display upnext-title">
            {momentHeadline(moment).replace(/\.$/, '')}
            <span className="wink">.</span>
          </h2>
          <div className="row wrap upnext-meta">
            <span className="row" style={{ gap: 6 }}>
              <Icon name="calendar" size={16} /> {shortDate(moment.date)}
            </span>
            {moment.venue && (
              <span className="row" style={{ gap: 6 }}>
                <Icon name="pin" size={16} /> {moment.venue}
              </span>
            )}
            {moment.weather && (
              <span className="row" style={{ gap: 6 }}>
                <Icon name={moment.weather.condition.includes('Clear') ? 'sun' : 'cloud'} size={16} /> {moment.weather.temperature}° · {moment.weather.condition}
              </span>
            )}
          </div>
        </div>
      </div>
    </MomentArt>
  );
}
