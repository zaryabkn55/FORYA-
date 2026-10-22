import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DepartmentSwitch } from '../components/Department';
import { Icon } from '../components/Icon';
import { Photo } from '../components/Photo';
import { ProductCard } from '../components/ProductCard';
import { api } from '../lib/api';
import { TIER_BRANDS, priceCheckFor, tierBrandsFor } from '../lib/catalogue';
import { applyIntent, isSmartQuery, momentScore, parseIntent, suitsWeather, topPicks, weatherAdvice, weatherFit } from '../lib/stylist';
import { daysUntil, shortDate } from '../lib/format';
import { img, type ImageKey } from '../lib/imagery';
import { useSession } from '../lib/session';
import { useStore } from '../lib/store';
import { useReveal } from '../lib/useReveal';
import { CATEGORIES, type Category, type Moment, type Product, type Tier } from '../lib/types';
import { isWet, weatherLine } from '../lib/weather';

const TIERS: { tier: Tier; line: string; wink: string; image: ImageKey }[] = [
  { tier: 'Affordable', line: 'The everyday edit.', wink: 'High street.', image: 'edWeekend' },
  { tier: 'Attainable', line: 'The investment buys.', wink: 'Worth it.', image: 'edCoffee' },
  { tier: 'Aspirational', line: 'The forever pieces.', wink: 'Luxury.', image: 'edCocktail' },
];

type Sort = 'recommended' | 'deals' | 'low' | 'high' | 'new';

export default function Discover() {
  useReveal();
  const { products, productsLoading, department } = useStore();
  const { user } = useSession();
  const [params, setParams] = useSearchParams();
  const tier = (params.get('tier') as Tier | null) ?? null;
  const brand = params.get('brand');
  const [moments, setMoments] = useState<Moment[]>([]);
  const [momentId, setMomentId] = useState<string>(params.get('moment') ?? '');
  const [weatherOn, setWeatherOn] = useState(true);
  const [cat, setCat] = useState<Category | 'All'>('All');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<Sort>('recommended');
  const [goodOnly, setGoodOnly] = useState(false);

  // The moments you're dressing for. Defaults to the next one that has a forecast.
  useEffect(() => {
    if (!user) return;
    api
      .moments()
      .then((ms) => {
        const upcoming = ms.filter((m) => daysUntil(m.date) >= 0);
        setMoments(upcoming);
        setMomentId((cur) => (cur && upcoming.some((m) => m.id === cur) ? cur : upcoming.find((m) => m.weather)?.id ?? ''));
      })
      .catch(() => setMoments([]));
  }, [user]);

  const moment = moments.find((m) => m.id === momentId);
  // A request typed in plain English ("linen for Lisbon under £100") is understood by the stylist engine.
  const intent = useMemo(() => parseIntent(q, Object.values(TIER_BRANDS).flat()), [q]);
  const smart = isSmartQuery(intent);
  const weather = weatherOn ? (smart && intent.weather) || moment?.weather : undefined;
  const suits = (p: Product) => suitsWeather(p, weather);

  const update = (patch: Record<string, string | null>) => {
    for (const [k, v] of Object.entries(patch)) v ? params.set(k, v) : params.delete(k);
    setParams(params, { replace: true });
  };
  const setTier = (t: Tier | null) => update({ tier: t, brand: null });
  const setBrand = (b: string | null) => update({ brand: b });

  const inTier = useMemo(() => products.filter((p) => !tier || p.tier === tier), [products, tier]);
  const brands = tier ? tierBrandsFor(tier, products) : [];

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const searched = smart ? new Set(applyIntent(inTier, { ...intent, weather: undefined }).map((r) => r.p.id)) : null;
    const filtered = inTier
      .filter((p) => !brand || p.brand === brand)
      .filter((p) => suitsWeather(p, weather))
      .filter((p) => cat === 'All' || p.category === cat)
      .filter((p) => (searched ? searched.has(p.id) : !needle || `${p.brand} ${p.name} ${p.colorName} ${p.category} ${p.material ?? ''}`.toLowerCase().includes(needle)))
      .map((p) => ({ p, check: priceCheckFor(p) }))
      .filter((r) => !goodOnly || r.check.verdict === 'good');
    const saving = (r: (typeof filtered)[number]) => (r.p.price - r.check.best.price) / r.p.price;
    switch (sort) {
      case 'low':
        return filtered.sort((a, b) => a.p.price - b.p.price);
      case 'high':
        return filtered.sort((a, b) => b.p.price - a.p.price);
      case 'deals':
        return filtered.sort((a, b) => saving(b) - saving(a));
      case 'new':
        return filtered.sort((a, b) => Number(!!b.p.isNew) - Number(!!a.p.isNew));
      default: {
        // The stylist engine's order: best for the weather and the occasion first.
        if (!weather) return filtered;
        const m = { occasion: (smart && intent.occasion) || moment?.occasion || 'Casual', weather };
        const score = new Map(filtered.map((r) => [r.p.id, momentScore(r.p, m).score]));
        return filtered.sort((a, b) => score.get(b.p.id)! - score.get(a.p.id)!);
      }
    }
  }, [inTier, brand, weather, cat, q, sort, goodOnly, smart, intent, moment]);

  const picks = useMemo(
    () => (weather && !tier && !brand && !q ? topPicks(products, { occasion: moment?.occasion ?? 'Casual', weather }, 4) : []),
    [weather, tier, brand, q, products, moment],
  );

  const hiddenByWeather = weather ? inTier.filter((p) => (!brand || p.brand === brand) && !suits(p)).length : 0;

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: 0 };
    for (const p of inTier) if ((!brand || p.brand === brand) && suitsWeather(p, weather)) (c[p.category] = (c[p.category] ?? 0) + 1), c.All++;
    return c;
  }, [inTier, brand, weather]);

  return (
    <div className="page">
      <div className="container stack" style={{ gap: 32 }}>
        <div className="stack" style={{ gap: 10 }}>
          <div className="row between wrap" style={{ gap: 12 }}>
            <span className="eyebrow">Discover · {department === 'men' ? 'Menswear' : 'Womenswear'}</span>
            <DepartmentSwitch compact />
          </div>
          <h1 className="h1">
            Find it. <span className="wink">Then find it for less.</span>
          </h1>
          <p className="lede">Shop for the weather where you're going. Every piece comes with a price verdict and the best place to buy it.</p>
        </div>

        {/* Dressing for: which moment, and its forecast */}
        <section className="forecast-bar">
          {user ? (
            moments.length ? (
              <>
                <div className="forecast-pick">
                  <span className="eyebrow">Dressing for</span>
                  <select className="select" value={momentId} onChange={(e) => setMomentId(e.target.value)} aria-label="Moment">
                    <option value="">No moment, show everything</option>
                    {moments.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title} · {shortDate(m.date)}
                      </option>
                    ))}
                  </select>
                </div>
                {moment?.weather ? (
                  <div className="forecast-weather">
                    <span className="forecast-temp">
                      <Icon name={/clear/i.test(moment.weather.condition) ? 'sun' : 'cloud'} size={22} />
                      {moment.weather.temperature}°
                    </span>
                    <div className="stack" style={{ gap: 2 }}>
                      <span className="h4">{weatherLine(moment).replace(/^\d+° · /, '')}</span>
                      <span className="small">
                        {weatherOn ? (
                          <>
                            <Icon name="sparkle" size={13} /> AI weather match: only fabrics and cuts that work for {moment.weather.temperature}°{isWet(moment.weather.condition) ? ', rain-ready first' : ''}.
                          </>
                        ) : (
                          'Showing everything.'
                        )}
                      </span>
                    </div>
                    <label className="switch">
                      <input type="checkbox" checked={weatherOn} onChange={(e) => setWeatherOn(e.target.checked)} />
                      <span>Weather match</span>
                    </label>
                  </div>
                ) : (
                  <span className="small">
                    {moment ? 'No forecast for this moment yet. Add a place to it and we’ll match the weather.' : 'Pick a moment to shop for its weather.'}
                  </span>
                )}
              </>
            ) : (
              <div className="row between wrap grow" style={{ gap: 12 }}>
                <span className="body">Add a moment with a place and we'll only show what suits the weather there.</span>
                <Link to="/moments?new=1" className="btn btn-primary btn-sm">
                  New moment
                </Link>
              </div>
            )
          ) : (
            <div className="row between wrap grow" style={{ gap: 12 }}>
              <span className="body">Log in to shop for the weather at your next moment.</span>
              <Link to="/login?next=%2Fdiscover" className="btn btn-primary btn-sm">
                Log in
              </Link>
            </div>
          )}
        </section>

        {/* Tiers */}
        <div className="tier-grid" data-reveal-stagger>
          {TIERS.map((t) => (
            <button key={t.tier} className={`tier-card ${tier === t.tier ? 'is-active' : ''}`} onClick={() => setTier(tier === t.tier ? null : t.tier)} aria-pressed={tier === t.tier}>
              <Photo src={img(t.image)} alt="" className="tier-photo" zoom eager />
              <div className="tier-text">
                <span className="eyebrow" style={{ color: 'rgba(246,245,242,.85)' }}>
                  {t.tier}
                </span>
                <span className="h3" style={{ color: 'var(--paper)' }}>
                  {t.line} <span className="wink">{t.wink}</span>
                </span>
              </div>
              {tier === t.tier && (
                <span className="tier-on">
                  <Icon name="check" size={16} stroke={2.2} />
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Brands in the chosen tier */}
        {tier && (
          <div className="stack" style={{ gap: 10, marginTop: -8 }}>
            <span className="eyebrow">{tier} brands</span>
            <div className="row wrap" style={{ gap: 8 }}>
              <button className={`chip ${!brand ? 'is-active' : ''}`} onClick={() => setBrand(null)}>
                All {tier.toLowerCase()}
              </button>
              {brands.map((b) => {
                const n = inTier.filter((p) => p.brand === b && suits(p)).length;
                return (
                  <button key={b} className={`chip ${brand === b ? 'is-active' : ''}`} onClick={() => setBrand(brand === b ? null : b)}>
                    {b} <span className="count">{n}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="discover-bar">
          <div className="input-icon grow" style={{ maxWidth: 420 }}>
            <Icon name="search" size={18} />
            <input className="input" placeholder="Search, or ask: “linen for Lisbon under £100”" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
          </div>
          <select className="select" style={{ width: 200, height: 42 }} value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort">
            <option value="recommended">Recommended</option>
            <option value="deals">Biggest savings</option>
            <option value="new">New in</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
          </select>
          <button className={`chip ${goodOnly ? 'is-active' : ''}`} onClick={() => setGoodOnly((v) => !v)} aria-pressed={goodOnly}>
            Good prices only
          </button>
        </div>

        <div className="scroll-x" style={{ gap: 8, marginTop: -16 }}>
          {(['All', ...CATEGORIES] as const)
            .filter((c) => c === 'All' || counts[c])
            .map((c) => (
              <button key={c} className={`chip ${cat === c ? 'is-active' : ''}`} onClick={() => setCat(c)}>
                {c} <span className="count">{counts[c] ?? 0}</span>
              </button>
            ))}
        </div>

        {smart && q.trim() && (
          <div className="understood">
            <span className="small">
              <Icon name="sparkle" size={13} /> Understood
            </span>
            {intent.chips.map((c) => (
              <span key={c} className="badge">
                {c}
              </span>
            ))}
            <button className="link small" onClick={() => window.dispatchEvent(new CustomEvent('forya:ask', { detail: q }))}>
              Ask the stylist instead
            </button>
          </div>
        )}

        {picks.length > 0 && weather && (
          <section className="ai-picks">
            <div className="ai-picks-head">
              <span className="eyebrow">
                <Icon name="sparkle" size={13} /> Picked by FORYA AI{moment ? ` for ${moment.title}` : ''}
              </span>
              <p className="body" style={{ margin: 0 }}>
                {weatherAdvice(weather, department)}
              </p>
            </div>
            <div className="product-grid">
              {picks.map((r) => (
                <ProductCard key={r.p.id} product={r.p} fit={r.fit} />
              ))}
            </div>
          </section>
        )}

        <div className="row between wrap" style={{ gap: 10 }}>
          <span className="small">
            {rows.length} piece{rows.length === 1 ? '' : 's'}
            {brand ? ` from ${brand}` : tier ? ` · ${tier}` : ''}
            {weather ? ` for ${weather.temperature}°` : ''}
            {hiddenByWeather > 0 && ` · ${hiddenByWeather} hidden for the weather`}
          </span>
          {(tier || brand || cat !== 'All' || q || goodOnly) && (
            <button
              className="link small"
              onClick={() => {
                update({ tier: null, brand: null });
                setCat('All');
                setGoodOnly(false);
                setQ('');
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        {productsLoading ? (
          <div className="product-grid">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="skeleton" style={{ aspectRatio: '4 / 6' }} />
            ))}
          </div>
        ) : rows.length ? (
          <div className="product-grid">
            {rows.map(({ p }) => (
              <ProductCard key={p.id} product={p} fit={weather ? weatherFit(p, weather) : undefined} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <h3 className="h3">
              {weather && hiddenByWeather ? 'Nothing here for that weather.' : 'Nothing matches.'} <span className="wink">Yet.</span>
            </h3>
            <p className="body">
              {weather && hiddenByWeather
                ? `${brand ?? 'This edit'} has ${hiddenByWeather} piece${hiddenByWeather === 1 ? '' : 's'} that don't suit ${weather.temperature}°.`
                : 'Try a different search or clear the filters.'}
            </p>
            {weather && hiddenByWeather > 0 && (
              <button className="btn btn-secondary" onClick={() => setWeatherOn(false)}>
                Show them anyway
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
