import { Link } from 'react-router-dom';
import { countdown, money, shortDate } from '../lib/format';
import { momentArt } from '../lib/momentArt';
import { useStore } from '../lib/store';
import type { Moment } from '../lib/types';
import { StatusChip } from './Bits';
import { Icon } from './Icon';
import { MomentArt } from './MomentArt';

export function MomentCard({ moment }: { moment: Moment }) {
  const { product } = useStore();
  const pieces = moment.look.pieces.map((pc) => product(pc.productId)).filter(Boolean);
  const total = pieces.reduce((s, p) => s + (p?.price ?? 0), 0);
  const art = momentArt(moment);
  const { value, unit } = countdown(moment.date);

  return (
    <Link to={`/moments/${moment.id}`} className="moment-card">
      <MomentArt art={art} className="moment-card-art">
        <div className="m-art-top">
          <span className="m-art-count">
            <span className="m-art-count-value">{value}</span>
            {unit && <span className="m-art-count-unit">{unit}</span>}
          </span>
          {art.note && <span className="m-art-note">{art.note}</span>}
        </div>
        <span className="m-art-occasion">{moment.occasion}</span>
        {pieces.length > 0 && (
          <div className="m-art-pieces">
            {pieces.slice(0, 4).map((p) => (
              <span key={p!.id} className="m-art-piece">
                <img src={p!.imageUrl} alt="" loading="lazy" />
              </span>
            ))}
          </div>
        )}
      </MomentArt>
      <div className="moment-card-body">
        <div className="row between" style={{ gap: 8 }}>
          <h3 className="h3">{moment.title}</h3>
          {moment.source === 'calendar' && (
            <span className="small row" style={{ gap: 4, flexShrink: 0 }}>
              <Icon name="calendar" size={13} /> Calendar
            </span>
          )}
        </div>
        <span className="small">
          {shortDate(moment.date)}
          {moment.venue ? ` · ${moment.venue}` : ''}
        </span>
        <div className="row between" style={{ marginTop: 'auto', paddingTop: 10 }}>
          <StatusChip status={moment.look.status} />
          {total > 0 && <span className="price small" style={{ color: 'var(--ink)' }}>{money(total)}</span>}
        </div>
      </div>
    </Link>
  );
}
