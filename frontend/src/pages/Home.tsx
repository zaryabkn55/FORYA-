import { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Photo } from '../components/Photo';
import { PriceCheck } from '../components/PriceCheck';
import { VerdictChip } from '../components/Bits';
import { CATALOGUE, bestNewPrice, priceCheckFor, productById } from '../lib/catalogue';
import { money } from '../lib/format';
import { img, type ImageKey } from '../lib/imagery';
import { buildLook } from '../lib/layout';
import { useSession } from '../lib/session';
import { useReveal } from '../lib/useReveal';
import './home.css';

const PROMPTS = ['Wedding on Saturday', 'Job interview', 'Dinner in Mayfair', 'Lisbon weekend'];

const MOMENTS: { title: string; note: string; image: ImageKey }[] = [
  { title: 'Cocktail hour', note: 'Black, but make it interesting.', image: 'edCocktail' },
  { title: 'The work day', note: 'Quietly sharp.', image: 'edWorkday' },
  { title: 'Dinner out', note: 'Let the city do the lighting.', image: 'edDinner' },
  { title: 'The weekend away', note: 'One bag. Every outfit.', image: 'edWeekend' },
  { title: 'The summer party', note: 'Colour, fully committed.', image: 'edParty' },
  { title: 'Saturday coffee', note: 'Effortless, apparently.', image: 'edCoffee' },
];
const BRANDS = ['Zara', 'Uniqlo', 'COS', 'Massimo Dutti', 'Reiss', 'Sandro', 'Gucci', 'Dior', 'Fendi'];

const WEDDING = ['p-linen-shirt', 'p-linen-blazer', 'p-linen-trousers', 'p-leather-belt', 'p-suede-loafers'];

export default function Home() {
  const { user } = useSession();
  const navigate = useNavigate();
  useReveal();
  const [plan, setPlan] = useState('');

  const go = (title: string) => {
    const q = title.trim() ? `&title=${encodeURIComponent(title.trim())}` : '';
    navigate(user ? `/moments?new=1${q}` : `/register?next=${encodeURIComponent(`/moments?new=1${q}`)}`);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    go(plan);
  };

  // The piece tagged on the hero shot: the black top-handle bag she is carrying.
  const heroPiece = productById('px-bottega-veneta-women-blacktote')!;
  const heroCheck = useMemo(() => priceCheckFor(heroPiece), [heroPiece]);

  const look = useMemo(() => {
    const products = WEDDING.map((id) => productById(id)!);
    const pieces = buildLook(products);
    const total = products.reduce((s, p) => s + p.price, 0);
    const best = products.reduce((s, p) => s + Math.min(p.price, bestNewPrice(priceCheckFor(p))), 0);
    return { products, pieces, total, best };
  }, []);

  return (
    <div className="home">
      {/* Hero ------------------------------------------------------------------------------ */}
      <section className="container hero is-entering">
        <div className="hero-copy">
          <span className="eyebrow">Your style journal for every moment</span>
          <h1 className="display">
            You've got plans.
            <br />
            <span className="wink">We've got the look.</span>
          </h1>
          <p className="lede">
            Tell FORYA what's coming up. We'll style it around the weather, the dress code and what's already in your wardrobe, then check every price
            so you never overpay.
          </p>

          <form className="hero-input" onSubmit={submit}>
            <Icon name="calendar" size={20} />
            <input value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="What's your next moment?" aria-label="What's your next moment?" />
            <button className="btn btn-primary">
              Style it <Icon name="arrowRight" size={18} />
            </button>
          </form>
          <div className="row wrap" style={{ gap: 8 }}>
            {PROMPTS.map((p) => (
              <button key={p} className="chip" onClick={() => go(p)}>
                {p}
              </button>
            ))}
          </div>
          {!user && (
            <p className="small" style={{ margin: 0 }}>
              Already planning?{' '}
              <Link to="/login" style={{ fontWeight: 600, color: 'var(--ink)' }}>
                Log in to see your moments
              </Link>
            </p>
          )}
        </div>

        <div className="hero-art">
          <Photo src={img('edHero')} alt="A black blazer, white denim and an armful of Frieze, London" className="hero-photo" eager position="50% 35%" />
          <div className="float-card float-moment">
            <span className="eyebrow">Up next</span>
            <div className="h4">The art fair, Saturday.</div>
            <div className="row small" style={{ gap: 6 }}>
              <Icon name="sun" size={15} /> 15° · Regent's Park
            </div>
          </div>
          <div className="float-card float-price">
            <img src={heroPiece.imageUrl} alt="" />
            <div className="stack" style={{ gap: 4 }}>
              <span className="brand-label">{heroPiece.brand}</span>
              <span className="h4" style={{ fontSize: 14 }}>
                {heroPiece.name}
              </span>
              <span className="small">
                Best price <strong style={{ color: 'var(--ink)' }}>{money(heroCheck.best.price)}</strong>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Brand strip ----------------------------------------------------------------------- */}
      <section className="brand-strip">
        <div className="container row" style={{ gap: 20, alignItems: 'center' }}>
          <span className="eyebrow" style={{ flexShrink: 0 }}>Styled from</span>
          <div className="marquee">
            <div className="marquee-track">
              {[0, 1].map((pass) => (
                <div className="marquee-set" key={pass} aria-hidden={pass === 1}>
                  {BRANDS.map((b) => (
                    <span key={b} className="brand-strip-name">
                      {b}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works ---------------------------------------------------------------------- */}
      <section className="section container" id="how">
        <div className="section-intro" data-reveal>
          <span className="eyebrow">How it works</span>
          <h2 className="h1">
            Three steps. <span className="wink">Zero panic.</span>
          </h2>
        </div>
        <div className="steps" data-reveal-stagger>
          <article className="step">
            <div className="step-art step-art-moments">
              {['Wedding · Sat', 'Interview · Mon', 'Lisbon · 18 days'].map((t, i) => (
                <div className="mini-moment" key={t} style={{ transform: `translateX(${i * 14}px)` }}>
                  <Icon name="calendar" size={16} /> {t}
                </div>
              ))}
            </div>
            <span className="step-num">01</span>
            <h3 className="h3">Add your moment</h3>
            <p className="body">Type it in or sync your calendar. We pull in the date, the place and the forecast.</p>
          </article>
          <article className="step">
            <Photo src={img('edStyling')} alt="A striped shirt, dark denim and a quilted bag" className="step-art" />
            <span className="step-num">02</span>
            <h3 className="h3">Build the look</h3>
            <p className="body">Drag pieces onto your canvas. Mix what you own with what you've saved, high street to high end.</p>
          </article>
          <article className="step">
            <div className="step-art step-art-price">
              <div className="mini-offer">
                <span>{heroCheck.offers.filter((o) => o.retailer !== heroPiece.brand).slice(-1)[0].retailer}</span>
                <span className="price">{money(heroCheck.offers.filter((o) => o.retailer !== heroPiece.brand).slice(-1)[0].price)}</span>
              </div>
              <div className="mini-offer">
                <span>{heroPiece.brand}</span>
                <span className="price">{money(heroPiece.price)}</span>
              </div>
              <div className="mini-offer is-best">
                <span>
                  {heroCheck.best.retailer} <span className="badge badge-ink" style={{ height: 18, fontSize: 10 }}>Best</span>
                </span>
                <span className="price">{money(heroCheck.best.price)}</span>
              </div>
            </div>
            <span className="step-num">03</span>
            <h3 className="h3">Pay the right price</h3>
            <p className="body">Every piece gets a price check across retailers and resale, so you know when to buy and where.</p>
          </article>
        </div>
      </section>

      {/* Moments gallery ------------------------------------------------------------------- */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="row between wrap" style={{ alignItems: 'flex-end', gap: 16, marginBottom: 28 }}>
            <h2 className="h1">
              Every moment <span className="wink">has a look.</span>
            </h2>
            <button className="btn btn-secondary" onClick={() => go('')}>
              Add yours <Icon name="arrowRight" size={18} />
            </button>
          </div>
        </div>
        <div className="container">
          <div className="moments-rail scroll-x" data-reveal-stagger>
            {MOMENTS.map((m) => (
              <button key={m.title} className="moment-tile" onClick={() => go(m.title.replace(/^The /, ''))}>
                <Photo src={img(m.image)} alt="" ratio="3 / 4" zoom />
                <div className="moment-tile-text">
                  <span className="h3" style={{ color: 'var(--paper)' }}>
                    {m.title}
                  </span>
                  <span className="wink" style={{ fontSize: 20, color: 'var(--paper)' }}>
                    {m.note}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Price check ----------------------------------------------------------------------- */}
      <section className="price-feature" id="price-check" data-reveal>
        <div className="container price-feature-grid">
          <div className="stack" style={{ gap: 20 }}>
            <span className="eyebrow">Price check</span>
            <h2 className="h1">
              Love it. <span className="wink">Don't overpay for it.</span>
            </h2>
            <p className="lede">
              FORYA compares the same piece across retailers and pre-owned marketplaces, tells you if the price is good, typical or high, and shows you
              the cheapest way to get it.
            </p>
            <ul className="ticks">
              <li>
                <Icon name="check" size={18} stroke={2} /> Verdicts on every piece, not just sale items
              </li>
              <li>
                <Icon name="check" size={18} stroke={2} /> New and pre-owned, side by side
              </li>
              <li>
                <Icon name="check" size={18} stroke={2} /> Price the whole look, then buy it for less
              </li>
            </ul>
          </div>
          <PriceCheck product={heroPiece} check={heroCheck} />
        </div>
      </section>

      {/* Buy the look for less ------------------------------------------------------------- */}
      <section className="section container">
        <div className="look-feature">
          <div className="look-canvas">
            {look.pieces.map((pc) => {
              const p = productById(pc.productId)!;
              return <img key={pc.id} src={p.imageUrl} alt={p.name} style={{ left: `${pc.x}%`, top: `${pc.y}%`, width: `${pc.w}%` }} />;
            })}
            <span className="hand look-note" style={{ left: '6%', top: '8%' }}>
              Linen, for Saturday.
            </span>
            <span className="hand look-note" style={{ right: '6%', bottom: '6%' }}>
              linen does the work ↑
            </span>
          </div>
          <div className="stack" style={{ gap: 20 }}>
            <span className="eyebrow">Buy the look for less</span>
            <h2 className="h1">
              One look. <span className="wink">Five pieces. One total.</span>
            </h2>
            <div className="look-list">
              {look.products.map((p) => (
                <div className="row between" key={p.id}>
                  <span className="row" style={{ gap: 10 }}>
                    <span className="brand-label" style={{ width: 84 }}>
                      {p.brand}
                    </span>
                    <span style={{ fontSize: 15 }}>{p.name}</span>
                  </span>
                  <VerdictChip verdict={priceCheckFor(p).verdict} small />
                </div>
              ))}
            </div>
            <div className="row between look-total">
              <span>
                Look total <span className="strike">{money(look.total)}</span>
              </span>
              <span className="h3">{money(look.best)}</span>
            </div>
            <span className="small">Shopping each piece at its best new price saves {money(look.total - look.best)}.</span>
          </div>
        </div>
      </section>

      {/* Wardrobe -------------------------------------------------------------------------- */}
      <section className="container" style={{ paddingBottom: 96 }}>
        <div className="wardrobe-feature" data-reveal>
          <Photo src={img('edBand')} alt="A cardigan, a pleated skirt and a suede bag on a city street" className="wardrobe-photo" position="62% 40%" />
          <div className="wardrobe-copy">
            <span className="eyebrow" style={{ color: 'var(--ink-soft)' }}>
              Wardrobe & journal
            </span>
            <h2 className="h1">
              Wear what <span className="wink">you've got.</span>
            </h2>
            <p className="body" style={{ color: 'var(--ink-soft)' }}>
              Tell us what you own and we'll style it first. Log your fits, count your wears, and see what's actually earning its place.
            </p>
            <Link to={user ? '/wardrobe' : '/register'} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
              {user ? 'Open your wardrobe' : 'Start your wardrobe'} <Icon name="arrowRight" size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Discover teaser ------------------------------------------------------------------- */}
      <section className="container" style={{ paddingBottom: 96 }}>
        <div className="row between wrap" style={{ alignItems: 'flex-end', marginBottom: 24, gap: 16 }}>
          <h2 className="h2">
            New this week <span className="wink">for ya.</span>
          </h2>
          <Link to="/discover" className="btn btn-quiet btn-sm">
            See everything <Icon name="arrowRight" size={16} />
          </Link>
        </div>
        <div className="teaser-grid">
          {CATALOGUE.filter((p) => p.isNew).map((p) => (
            <Link to="/discover" key={p.id} className="teaser">
              <div className="pcard-media">
                <img src={p.imageUrl} alt={p.name} loading="lazy" />
              </div>
              <span className="brand-label">{p.brand}</span>
              <span className="pcard-name">{p.name}</span>
              <span className="price">{money(p.price)}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA ------------------------------------------------------------------------------- */}
      <section className="container" style={{ paddingBottom: 96 }}>
        <div className="cta">
          <h2 className="display" style={{ fontSize: 'clamp(40px, 6vw, 76px)' }}>
            What's the <span className="wink">plan?</span>
          </h2>
          <p className="lede" style={{ color: 'rgba(246,245,242,.72)', textAlign: 'center' }}>
            Free to start. Add your first moment in under a minute.
          </p>
          <button className="btn btn-lg" style={{ background: 'var(--paper)', color: 'var(--ink)' }} onClick={() => go('')}>
            Get started <Icon name="arrowRight" size={18} />
          </button>
        </div>
      </section>
    </div>
  );
}
