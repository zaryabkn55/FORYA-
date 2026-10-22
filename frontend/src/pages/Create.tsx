/** Moments: a month at a glance on the left, everything in it on the right. (File name kept from the first build.) */
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AddMomentDialog } from '../components/AddMomentDialog';
import { Icon } from '../components/Icon';
import { MomentCalendar } from '../components/MomentCalendar';
import { MomentRow } from '../components/MomentRow';
import { api } from '../lib/api';
import { countdown, dayKey, daysUntil, relativeDay } from '../lib/format';
import { useStore } from '../lib/store';
import type { Moment } from '../lib/types';

type Filter = 'upcoming' | 'todo' | 'ready' | 'past';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'todo', label: 'Needs a look' },
  { id: 'ready', label: 'Ready' },
  { id: 'past', label: 'Past' },
];

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

export default function Create() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useStore();
  const [moments, setMoments] = useState<Moment[] | null>(null);
  const [filter, setFilter] = useState<Filter>('upcoming');
  const [query, setQuery] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [day, setDay] = useState<string | null>(null);
  const [addDate, setAddDate] = useState<Date | undefined>();
  const adding = params.get('new') === '1';

  const load = () => api.moments().then(setMoments).catch(() => setMoments([]));
  useEffect(() => {
    load();
  }, []);

  const closeDialog = () => {
    params.delete('new');
    params.delete('title');
    setParams(params, { replace: true });
    setAddDate(undefined);
  };

  const sync = async () => {
    setSyncing(true);
    try {
      const { added } = await api.syncCalendar();
      toast(added.length ? `${added.length} new moment${added.length === 1 ? '' : 's'} from your calendar.` : 'Calendar is up to date.', added.length ? 'Busy you.' : undefined);
      await load();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  const all = moments ?? [];

  const counts = useMemo(() => {
    const up = all.filter((m) => daysUntil(m.date) >= 0);
    return {
      upcoming: up.length,
      todo: up.filter((m) => m.look.status !== 'ready').length,
      ready: up.filter((m) => m.look.status === 'ready').length,
      past: all.length - up.length,
    };
  }, [moments]);

  // A picked day speaks for itself, so it overrides the filter chips; search always applies.
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all
      .filter((m) => {
        if (day) return dayKey(m.date) === day;
        const upcoming = daysUntil(m.date) >= 0;
        if (filter === 'past') return !upcoming;
        if (!upcoming) return false;
        if (filter === 'todo') return m.look.status !== 'ready';
        if (filter === 'ready') return m.look.status === 'ready';
        return true;
      })
      .filter((m) => !q || `${m.title} ${m.venue ?? ''} ${m.occasion}`.toLowerCase().includes(q))
      .sort((a, b) => (filter === 'past' && !day ? -1 : 1) * (+new Date(a.date) - +new Date(b.date)));
  }, [moments, filter, query, day]);

  // One heading per day, so the list reads like a diary rather than a pile of cards.
  const groups = useMemo(() => {
    const out: { key: string; label: string; note: string; items: Moment[] }[] = [];
    for (const m of shown) {
      const key = dayKey(m.date);
      const last = out[out.length - 1];
      if (last && last.key === key) last.items.push(m);
      else
        out.push({
          key,
          label: new Date(m.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }),
          note: relativeDay(m.date),
          items: [m],
        });
    }
    return out;
  }, [shown]);

  const openAdd = (date?: Date) => {
    setAddDate(date);
    setParams({ new: '1' });
  };

  const next = useMemo(() => all.filter((m) => daysUntil(m.date) >= 0).sort((a, b) => +new Date(a.date) - +new Date(b.date))[0], [moments]);
  const monthCount = all.filter((m) => new Date(m.date).getMonth() === month.getMonth() && new Date(m.date).getFullYear() === month.getFullYear()).length;

  const selectedLabel = day ? new Date(`${day}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) : '';

  return (
    <div className="page">
      <div className="container stack" style={{ gap: 28 }}>
        <div className="row between wrap" style={{ gap: 20, alignItems: 'flex-end' }}>
          <div className="stack" style={{ gap: 8 }}>
            <span className="eyebrow">Moments</span>
            <h1 className="h1">
              You've got <span className="wink">plans.</span>
            </h1>
            <p className="body">Every moment gets its own canvas. Style it now, wear it later.</p>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <button className="btn btn-quiet" onClick={sync} disabled={syncing}>
              <Icon name="sync" size={18} /> {syncing ? 'Syncing…' : 'Sync calendar'}
            </button>
            <button className="btn btn-primary" onClick={() => openAdd()}>
              <Icon name="plus" size={18} stroke={2} /> New moment
            </button>
          </div>
        </div>

        <div className="moments-layout">
          <aside className="moments-aside">
            <MomentCalendar
              moments={all}
              month={month}
              onMonth={(delta) => setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1))}
              selected={day}
              onSelect={setDay}
              onAdd={(d) => {
                const at = new Date(d);
                at.setHours(19, 0, 0, 0);
                openAdd(at);
              }}
            />

            <div className="cal-side">
              <div className="row between">
                <span className="eyebrow">{month.toLocaleDateString('en-GB', { month: 'long' })}</span>
                <span className="small">
                  {monthCount} moment{monthCount === 1 ? '' : 's'}
                </span>
              </div>
              {next && (
                <Link to={`/moments/${next.id}`} className="cal-next">
                  <span className="cal-next-count">
                    <span className="cal-next-value">{countdown(next.date).value}</span>
                    {countdown(next.date).unit && <span className="cal-next-unit">{countdown(next.date).unit}</span>}
                  </span>
                  <span className="stack" style={{ gap: 2, minWidth: 0 }}>
                    <span className="eyebrow">Next up</span>
                    <span className="h4 m-row-title">{next.title}</span>
                    <span className="small">{next.venue ?? relativeDay(next.date)}</span>
                  </span>
                  <Icon name="arrowRight" size={16} />
                </Link>
              )}
            </div>
          </aside>

          <div className="moments-main">
            <div className="row between wrap" style={{ gap: 16 }}>
              <div className="row wrap" style={{ gap: 8 }}>
                {day ? (
                  <button className="chip is-active" onClick={() => setDay(null)}>
                    {selectedLabel} <Icon name="close" size={13} />
                  </button>
                ) : (
                  FILTERS.map((f) => (
                    <button key={f.id} className={`chip ${filter === f.id ? 'is-active' : ''}`} onClick={() => setFilter(f.id)}>
                      {f.label} <span className="count">{counts[f.id]}</span>
                    </button>
                  ))
                )}
              </div>
              <div className="input-icon" style={{ width: 'min(300px, 100%)' }}>
                <Icon name="search" size={18} />
                <input className="input" style={{ height: 44 }} placeholder="Search moments" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
            </div>

            {moments === null ? (
              <div className="stack" style={{ gap: 12 }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="skeleton" style={{ height: 104, borderRadius: 20 }} />
                ))}
              </div>
            ) : groups.length ? (
              <div className="m-list">
                {groups.map((g, gi) => (
                  <section key={g.key} className="m-group">
                    <header className="m-group-head reveal" style={{ animationDelay: `${Math.min(gi, 6) * 60}ms` }}>
                      <span className="m-group-label">{g.label}</span>
                      <span className="m-group-rule" aria-hidden="true" />
                      <span className="m-group-note">{g.note}</span>
                    </header>
                    {g.items.map((m, i) => (
                      <MomentRow key={m.id} moment={m} index={gi + i} />
                    ))}
                  </section>
                ))}
                {filter !== 'past' && !day && (
                  <button className="m-add reveal" style={{ animationDelay: '260ms' }} onClick={() => openAdd()}>
                    <span className="icon-btn">
                      <Icon name="plus" size={18} />
                    </span>
                    <span className="stack" style={{ gap: 2 }}>
                      <span className="h4">Add a moment</span>
                      <span className="small">Wedding? Weekend away? Big meeting?</span>
                    </span>
                    <Icon name="arrowRight" size={18} />
                  </button>
                )}
              </div>
            ) : (
              <div className="empty">
                <h3 className="h3">
                  {query
                    ? 'Nothing matches that.'
                    : day
                      ? 'Nothing on that day.'
                      : filter === 'ready'
                        ? 'No looks ready yet.'
                        : filter === 'past'
                          ? 'No past moments yet.'
                          : 'Nothing planned.'}{' '}
                  <span className="wink">{filter === 'ready' ? 'Soon.' : 'Yet.'}</span>
                </h3>
                <p className="body">Add a moment or sync your calendar to bring your plans in.</p>
                <div className="row" style={{ gap: 10 }}>
                  <button className="btn btn-quiet" onClick={sync}>
                    <Icon name="sync" size={18} /> Sync calendar
                  </button>
                  <button className="btn btn-primary" onClick={() => openAdd(day ? new Date(`${day}T19:00:00`) : undefined)}>
                    New moment
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {adding && (
        <AddMomentDialog
          initialTitle={params.get('title') ?? ''}
          initialDate={addDate}
          onClose={closeDialog}
          onCreated={(m) => {
            toast(`${m.title} added.`, 'Now the fun bit.');
            navigate(`/moments/${m.id}`);
          }}
        />
      )}
    </div>
  );
}
