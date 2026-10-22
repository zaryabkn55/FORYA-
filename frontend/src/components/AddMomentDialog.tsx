import { FormEvent, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { OCCASIONS, type Moment, type Occasion, type Weather } from '../lib/types';
import { Icon } from './Icon';
import { Modal } from './Overlay';
import { describeCode } from '../lib/weather';

interface GeoCity {
  id: number;
  name: string;
  admin1?: string;
  country: string;
  latitude: number;
  longitude: number;
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
  const [suggestions, setSuggestions] = useState<GeoCity[]>([]);
  const [weather, setWeather] = useState<Weather | undefined>();
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [forecastFor, setForecastFor] = useState<'day' | 'season' | 'now' | 'guess'>('now');

  // City autocomplete (Open-Meteo geocoding, no key needed).
  useEffect(() => {
    if (picked || venue.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(venue.trim())}&count=5&language=en&format=json`);
        const data = await res.json();
        setSuggestions(data.results ?? []);
      } catch {
        setSuggestions([]);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [venue, picked]);

  const pickCity = (c: GeoCity) => {
    setPicked(true);
    setVenue([c.name, c.admin1, c.country].filter(Boolean).join(', '));
    setSuggestions([]);
    setCoords({ lat: c.latitude, lon: c.longitude });
  };

  // The forecast for the day when it's within range (16 days). Further out, the typical weather for that
  // time of year (the same week last year), so a July trip booked in October is dressed for July.
  useEffect(() => {
    if (!coords) return;
    let live = true;
    const day = date.slice(0, 10);
    const ahead = (new Date(day).getTime() - new Date(new Date().toISOString().slice(0, 10)).getTime()) / 86_400_000;
    const mode: 'day' | 'season' | 'now' = ahead >= 0 && ahead <= 15 ? 'day' : ahead > 15 ? 'season' : 'now';
    const at = `latitude=${coords.lat}&longitude=${coords.lon}&timezone=auto`;
    const shift = (d: string, years: number, days = 0) => {
      const x = new Date(`${d}T12:00:00Z`);
      x.setUTCFullYear(x.getUTCFullYear() - years);
      x.setUTCDate(x.getUTCDate() + days);
      return x.toISOString().slice(0, 10);
    };
    const yearsBack = Math.max(1, Math.ceil(ahead / 365));
    const url =
      mode === 'day'
        ? `https://api.open-meteo.com/v1/forecast?${at}&daily=temperature_2m_max,apparent_temperature_max,weather_code,precipitation_probability_max,wind_speed_10m_max&start_date=${day}&end_date=${day}`
        : mode === 'season'
          ? `https://archive-api.open-meteo.com/v1/archive?${at}&daily=temperature_2m_max,weather_code,precipitation_sum&start_date=${shift(day, yearsBack, -3)}&end_date=${shift(day, yearsBack, 3)}`
          : `https://api.open-meteo.com/v1/forecast?${at}&current=temperature_2m,weather_code`;
    setLoadingWeather(true);
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (!live) return;
        if (mode === 'season') {
          const temps: number[] = (data.daily?.temperature_2m_max ?? []).filter((n: unknown) => typeof n === 'number');
          const rain: number[] = data.daily?.precipitation_sum ?? [];
          const codes: number[] = data.daily?.weather_code ?? [];
          if (!temps.length) throw new Error('no data');
          const avg = temps.reduce((a, b) => a + b, 0) / temps.length;
          const wetDays = rain.filter((r) => r >= 1).length;
          const typical = codes.slice().sort((a, b) => codes.filter((c) => c === b).length - codes.filter((c) => c === a).length)[0] ?? 0;
          setWeather({ temperature: Math.round(avg), condition: wetDays >= 4 ? 'Showers' : describeCode(typical), rainChance: Math.round((wetDays / Math.max(1, rain.length)) * 100) });
        } else {
          const d = data.daily;
          const t = mode === 'day' ? d?.temperature_2m_max?.[0] : data.current?.temperature_2m;
          const code = mode === 'day' ? d?.weather_code?.[0] : data.current?.weather_code;
          setWeather(
            typeof t === 'number'
              ? {
                  temperature: Math.round(t),
                  condition: describeCode(code ?? 0),
                  ...(mode === 'day' && typeof d?.apparent_temperature_max?.[0] === 'number' ? { feelsLike: Math.round(d.apparent_temperature_max[0]) } : {}),
                  ...(mode === 'day' && typeof d?.precipitation_probability_max?.[0] === 'number' ? { rainChance: d.precipitation_probability_max[0] } : {}),
                  ...(mode === 'day' && typeof d?.wind_speed_10m_max?.[0] === 'number' ? { windKph: Math.round(d.wind_speed_10m_max[0]) } : {}),
                }
              : undefined,
          );
        }
        setForecastFor(mode);
      })
      .catch(() => live && setWeather(undefined))
      .finally(() => live && setLoadingWeather(false));
    return () => {
      live = false;
    };
  }, [coords, date]);

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
                <button type="button" className="menu-item" key={c.id} onClick={() => pickCity(c)}>
                  <Icon name="pin" size={16} />
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
