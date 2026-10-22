import { useEffect, useState } from 'react';
import { getPoints, levelFor } from '../lib/points';
import { useSession } from '../lib/session';
import { Icon } from './Icon';

/** "120 style points · Trendsetter", with a progress ring towards the next level. */
export function PointsChip() {
  const { user } = useSession();
  const [total, setTotal] = useState(() => getPoints(user?.id).total);
  useEffect(() => {
    const update = () => setTotal(getPoints(user?.id).total);
    update();
    window.addEventListener('forya:points', update);
    return () => window.removeEventListener('forya:points', update);
  }, [user]);
  const { level, next, progress } = levelFor(total);
  const deg = Math.round(progress * 360);
  return (
    <div className="points-chip" title={next ? `${next.at - total} points to ${next.name}` : 'Top level reached'}>
      <span className="points-ring" style={{ background: `conic-gradient(var(--ink) ${deg}deg, var(--linen) 0)` }}>
        <span>
          <Icon name="trophy" size={15} />
        </span>
      </span>
      <span className="stack" style={{ gap: 0 }}>
        <strong style={{ fontSize: 14 }}>{total} style points</strong>
        <span className="small" style={{ fontSize: 12 }}>{level.name}</span>
      </span>
    </div>
  );
}
