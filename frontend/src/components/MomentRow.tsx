/**
 * A moment in the list beside the calendar. The date stamp leads, the occasion's own colour runs
 * down the left edge, and the look's pieces sit on the right — so a styled moment looks finished
 * at a glance and an unstyled one quietly asks for attention.
 */
import { Link } from 'react-router-dom';
import { Icon } from './Icon';
import { StatusChip } from './Bits';
import { countdown, money } from '../lib/format';
import { artStyle, momentArt } from '../lib/momentArt';
import { useStore } from '../lib/store';
import type { Moment } from '../lib/types';

export function MomentRow({ moment, index = 0 }: { moment: Moment; index?: number }) {
  const { product } = useStore();
  const pieces = moment.look.pieces.map((pc) => product(pc.productId)).filter(Boolean);
  const total = pieces.reduce((s, p) => s + (p?.price ?? 0), 0);
  const art = momentArt(moment);
  const date = new Date(moment.date);
  const { value, unit } = countdown(moment.date);

  return (
    <Link
      to={`/moments/${moment.id}`}
      className="m-row reveal"
      style={{ ...artStyle(art), animationDelay: `${Math.min(index, 8) * 55}ms` }}
    >
      <span className="m-row-edge" aria-hidden="true" />

      <span className="m-row-date">
        <span className="m-row-day">{date.getDate()}</span>
        <span className="m-row-mon">{date.toLocaleDateString('en-GB', { month: 'short' })}</span>
      </span>

      <span className="m-row-main">
        <span className="m-row-top">
          <span className="eyebrow">{moment.occasion}</span>
          {moment.source === 'calendar' && (
            <span className="small row" style={{ gap: 4 }}>
              <Icon name="calendar" size={12} /> Calendar
            </span>
          )}
        </span>
        <span className="h3 m-row-title">{moment.title}</span>
        <span className="m-row-meta small">
          <span>
            {date.toLocaleDateString('en-GB', { weekday: 'long' })}
            {', '}
            {date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {moment.venue && (
            <span className="row" style={{ gap: 4 }}>
              <Icon name="pin" size={12} /> {moment.venue}
            </span>
          )}
          {art.note && (
            <span className="row" style={{ gap: 4 }}>
              <Icon name={art.sky === 'sun' ? 'sun' : 'cloud'} size={12} /> {art.note}
            </span>
          )}
        </span>
      </span>

      <span className="m-row-look">
        {pieces.length > 0 ? (
          <span className="m-row-pieces">
            {pieces.slice(0, 4).map((p) => (
              <span key={p!.id} className="m-art-piece">
                <img src={p!.imageUrl} alt="" loading="lazy" />
              </span>
            ))}
          </span>
        ) : (
          <span className="m-row-empty" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span key={i} />
            ))}
          </span>
        )}
      </span>

      <span className="m-row-end">
        <span className="m-row-count">
          <span className="m-row-count-value">{value}</span>
          {unit && <span className="m-row-count-unit">{unit}</span>}
        </span>
        <span className="m-row-status">
          <StatusChip status={moment.look.status} />
          {total > 0 && <span className="price small">{money(total)}</span>}
        </span>
      </span>

      <span className="m-row-go" aria-hidden="true">
        <Icon name="arrowRight" size={18} />
      </span>
    </Link>
  );
}
