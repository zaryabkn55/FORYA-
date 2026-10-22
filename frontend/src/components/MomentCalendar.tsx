/**
 * The month view on Moments. Every day that holds something is marked with a dot in that moment's
 * own colour (the same temperature band its card is drawn from), upcoming days read stronger than
 * past ones, and picking a day filters the list beside it. Picking an empty day starts a moment on
 * that date, so the calendar is a way in as well as a way to look.
 */
import { useMemo } from 'react';
import { Icon } from './Icon';
import { BAND_TINT, momentArt } from '../lib/momentArt';
import { dayKey } from '../lib/format';
import type { Moment } from '../lib/types';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function MomentCalendar({
  moments,
  month,
  onMonth,
  selected,
  onSelect,
  onAdd,
}: {
  moments: Moment[];
  month: Date;
  onMonth: (delta: number) => void;
  selected: string | null;
  onSelect: (key: string | null) => void;
  onAdd: (date: Date) => void;
}) {
  const todayKey = dayKey(new Date());

  // One bucket per day, so a day with three moments shows three dots.
  const byDay = useMemo(() => {
    const map = new Map<string, Moment[]>();
    for (const m of moments) {
      const k = dayKey(m.date);
      const list = map.get(k);
      if (list) list.push(m);
      else map.set(k, [m]);
    }
    return map;
  }, [moments]);

  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const lead = (first.getDay() + 6) % 7; // weeks start on Monday
    const start = new Date(first);
    start.setDate(1 - lead);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [month]);

  const label = month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  return (
    <section className="cal" aria-label="Moments calendar">
      <header className="cal-head">
        <span className="cal-month">{label}</span>
        <div className="cal-nav">
          <button className="cal-arrow" onClick={() => onMonth(-1)} aria-label="Previous month">
            <Icon name="arrowLeft" size={16} />
          </button>
          <button className="cal-arrow" onClick={() => onMonth(1)} aria-label="Next month">
            <Icon name="arrowRight" size={16} />
          </button>
        </div>
      </header>

      <div className="cal-weekdays" aria-hidden="true">
        {WEEKDAYS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      <div className="cal-grid" key={label}>
        {cells.map((d) => {
          const key = dayKey(d);
          const list = byDay.get(key) ?? [];
          const outside = d.getMonth() !== month.getMonth();
          const past = key < todayKey;
          const cls = [
            'cal-day',
            outside ? 'is-outside' : '',
            past ? 'is-past' : '',
            key === todayKey ? 'is-today' : '',
            key === selected ? 'is-selected' : '',
            list.length ? 'has-moments' : '',
          ]
            .filter(Boolean)
            .join(' ');

          const title = list.length
            ? `${d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} — ${list.map((m) => m.title).join(', ')}`
            : `Add a moment on ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}`;

          return (
            <button
              key={key}
              className={cls}
              title={title}
              aria-pressed={key === selected}
              onClick={() => {
                if (list.length) onSelect(key === selected ? null : key);
                else onAdd(d);
              }}
            >
              <span className="cal-num">{d.getDate()}</span>
              {list.length > 0 && (
                <span className="cal-dots">
                  {list.slice(0, 3).map((m) => (
                    <i key={m.id} style={{ background: BAND_TINT[momentArt(m).band].deep }} />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <footer className="cal-foot">
        {selected ? (
          <button className="btn btn-quiet btn-sm" onClick={() => onSelect(null)}>
            <Icon name="close" size={14} /> Clear day
          </button>
        ) : (
          <span className="small">Pick a marked day to filter, or an empty one to plan something.</span>
        )}
      </footer>
    </section>
  );
}
