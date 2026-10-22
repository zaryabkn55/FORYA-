import { FormEvent, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { OCCASIONS, type Moment, type Occasion, type Weather } from '../lib/types';
import { Icon } from './Icon';
import { Modal } from './Overlay';

interface GeoPlace {
  name: string;
  label: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
  kind: 'postcode' | 'city' | 'place';
}

const GUESSES: Weather[] = [
  { temperature: 24, condition: 'Warm' },
  { temperature: 15, condition: 'Mild' },
  { temperature: 6, condition: 'Cold' },
  { temperature: 12, condition: 'Rainy' },
];

const toLocalInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

export function AddMomentDialog({
  initialTitle = '',
  initialDate,
  onClose,
  onCreated,
}: {
  initialTitle?: string;
  /** A day picked on the calendar. Defaults to a week out at 7pm. */
  initialDate?: Date;
  onClose: () => void;
  onCreated: (m: Moment) => void;
}) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 7);
  tomorrow.setHours(19, 0, 0, 0);

  const [title, setTitle] = useState(initialTitle);
  const [occasion, setOccasion] = useState<Occasion>(guessOccasion(initialTitle));
  const [date, setDate] = useState(toLocalInput(initialDate ?? tomorrow));
  const [venue, setVenue] = useState('');
  const [notes, setNotes] = useState('');
  const [suggestions, setSuggestions] = useState<GeoPlace[]>([]);
  const [weather, setWeather] = useState<Weather | undefined>();
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [forecastFor, setForecastFor] = useState<'day' | 'season' | 'now' | 'guess'>('now');

  // Place autocomplete. Served from our own origin so the content-security-policy stays tight,
  // and so a postcode works: the server tries postcodes.io, then cities, then named venues.
  useEffect(() => {
    if (picked || venue.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/weather/search?q=${encodeURIComponent(venue.trim())}`);
        const data = await res.json();
        setSuggestions(data.results ?? []);
      } catch {
        setSuggestions([]);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [venue, picked]);

  const pickCity = (c: GeoPlace) => {
    setPicked(true);
    setVenue(c.label || [c.name, c.admin1, c.country].filter(Boolean).join(', '));
    setSuggestions([]);
    setCoords({ lat: c.latitude, lon: c.longitude });
  };

  /**
   * The forecast, from our own API.
   *
   * Two things changed here. The lookup runs on whatever is typed, not only on a suggestion
   * the user clicked — so "SW1A 1AA" or "Babington House, Somerset" resolves on its own, which
   * is what people actually do. And the request is same-origin, so the server can reach a
   * postcode geocoder that Open-Meteo doesn't cover, and the page's content-security-policy
   * doesn't have to allow arbitrary third-party hosts.
   *
   * The server picks the horizon: the day's forecast inside 16 days, the typical weather for
   * that week of the year further out, otherwise what it's like there now.
   */
  useEffect(() => {
    const place = venue.trim();
    if (!coords && place.length < 2) {
      setWeather(undefined);
      setForecastFor('now');
      return;
    }

    let live = true;
    const day = date.slice(0, 10);
    const query = coords
      ? `lat=${coords.lat}&lon=${coords.lon}&date=${day}`
      : `place=${encodeURIComponent(place)}&date=${day}`;

    // Debounce the typed case so we aren't asking on every keystroke; a picked place is exact,
    // so that one fires straight away.
    const delay = coords ? 0 : 500;
    const timer = setTimeout(() => {
      setLoadingWeather(true);
      fetch(`/api/weather?${query}`)
        .then((r) => r.json())
        .then((data) => {
          if (!live) return;
          setWeather(data?.weather ?? undefined);
          setForecastFor(data?.weather ? (data.mode ?? 'now') : 'guess');
        })
        .catch(() => {
          if (live) {
            setWeather(undefined);
            setForecastFor('guess');
          }
        })
        .finally(() => live && setLoadingWeather(false));
    }, delay);

    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [coords, venue, date]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError('Give your moment a name.');
    setBusy(true);
    setError('');
    try {
      const m = await api.addMoment({ title: title.trim(), occasion, date: new Date(date).toISOString(), venue: venue.trim() || undefined, notes: notes.trim() || undefined, weather });
      onCreated(m);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <Modal title="New" wink="moment." onClose={onClose}>
      <form className="stack" style={{ gap: 18 }} onSubmit={submit}>
        <div className="field">
          <label className="label" htmlFor="m-title">
            What's the plan?
          </label>
          <input
            id="m-title"
            className="input"
            placeholder="Wedding, interview, Lisbon…"
            value={title}
            autoFocus
            onChange={(e) => {
              setTitle(e.target.value);
              setOccasion(guessOccasion(e.target.value, occasion));
            }}
          />
        </div>

        <div className="field">
          <span className="label">Kind of moment</span>
          <div className="row wrap" style={{ gap: 8 }}>
            {OCCASIONS.map((o) => (
              <button type="button" key={o} className={`chip ${o === occasion ? 'is-active' : ''}`} onClick={() => setOccasion(o)}>
                {o}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="label" htmlFor="m-date">
            When
          </label>
          <input id="m-date" type="datetime-local" className="input" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>

        <div className="field" style={{ position: 'relative' }}>
          <label className="label" htmlFor="m-venue">
            Where <span className="hint">(we'll check the weather)</span>
          </label>
          <div className="input-icon">
            <Icon name="pin" size={18} />
            <input
              id="m-venue"
              className="input"
              placeholder="City or venue"
              value={venue}
              autoComplete="off"
              onChange={(e) => {
                setVenue(e.target.value);
                setPicked(false);
                setCoords(null);
                setWeather(undefined);
              }}
            />
          </div>
          {suggestions.length > 0 && (
            <div className="menu" style={{ left: 0, right: 0, top: '100%' }}>
              {suggestions.map((c) => (
                <button type="button" className="menu-item" key={`${c.kind}:${c.latitude},${c.longitude}`} onClick={() => pickCity(c)}>
                  <Icon name={c.kind === 'postcode' ? 'search' : 'pin'} size={16} />
                  <span>
                    {c.name}
                    <span className="small">{[c.admin1, c.country].filter(Boolean).map((s) => ` · ${s}`)}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
          {(loadingWeather || weather) && (
            <div className="row small" style={{ gap: 8 }}>
              <Icon name={weather?.condition.includes('Clear') ? 'sun' : 'cloud'} size={16} />
              {loadingWeather
                ? 'Checking the forecast…'
                : forecastFor === 'guess'
                  ? `Dressing for ${weather!.condition.toLowerCase()} (about ${weather!.temperature}°).`
                  : forecastFor === 'season'
                    ? `Usually about ${weather!.temperature}° and ${weather!.condition.toLowerCase()} there at that time of year. FORYA will dress you for that.`
                    : `${weather!.temperature}° and ${weather!.condition.toLowerCase()} ${forecastFor === 'day' ? 'forecast for the day' : 'there right now'}. Discover will show pieces for it.`}
            </div>
          )}
          {!loadingWeather && (!weather || forecastFor === 'guess') && (
            <div className="row wrap" style={{ gap: 8 }}>
              <span className="small">{coords ? 'No forecast yet. What are you expecting?' : 'Or tell us what to expect:'}</span>
              {GUESSES.map((g) => (
                <button
                  type="button"
                  key={g.condition}
                  className={`chip ${weather?.condition === g.condition ? 'is-active' : ''}`}
                  style={{ height: 32, fontSize: 13 }}
                  onClick={() => {
                    setWeather(g);
                    setForecastFor('guess');
                  }}
                >
                  {g.condition}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="field">
          <label className="label" htmlFor="m-notes">
            Notes <span className="hint">(optional)</span>
          </label>
          <textarea id="m-notes" className="textarea" placeholder="Dress code, who's going, the vibe…" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'Adding…' : 'Add moment'} <Icon name="arrowRight" size={18} />
          </button>
        </div>
      </form>
    </Modal>
  );
}

function guessOccasion(text: string, fallback: Occasion = 'Casual'): Occasion {
  const t = text.toLowerCase();
  if (/wedding|gala|black tie|ball|christening/.test(t)) return 'Formal';
  if (/interview|meeting|work|office|client|pitch|conference/.test(t)) return 'Work';
  if (/dinner|lunch|brunch|date/.test(t)) return 'Dinner';
  if (/party|drinks|cocktail|birthday|club|gig|view|launch/.test(t)) return 'Party';
  if (/trip|holiday|weekend away|lisbon|paris|beach|travel|flight/.test(t)) return 'Holiday';
  return text ? fallback : 'Casual';
}
