/** Small shared pieces: status and verdict chips, the mini look preview and route guard. */
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { STATUS_LABEL, VERDICT_LABEL } from '../lib/format';
import { useSession } from '../lib/session';
import { useStore } from '../lib/store';
import type { Look, LookStatus, Verdict } from '../lib/types';

export function StatusChip({ status }: { status: LookStatus }) {
  const cls = status === 'ready' ? 'badge-ink' : status === 'in-progress' ? 'badge-oat' : 'badge-outline';
  return <span className={`badge badge-dot ${cls}`}>{STATUS_LABEL[status]}</span>;
}

export function VerdictChip({ verdict, small }: { verdict: Verdict; small?: boolean }) {
  const cls = verdict === 'good' ? 'badge-good' : verdict === 'high' ? 'badge-high' : 'badge-white';
  return (
    <span className={`badge badge-dot ${cls}`} style={small ? { height: 22, fontSize: 11 } : undefined}>
      {VERDICT_LABEL[verdict]}
    </span>
  );
}

/** Read-only miniature of a look canvas. */
export function LookPreview({ look, empty = 'Nothing here yet' }: { look: Look; empty?: string }) {
  const { product } = useStore();
  const pieces = [...look.pieces].sort((a, b) => a.z - b.z);
  return (
    <div className="look-preview">
      {pieces.length === 0 && <div className="look-preview-empty">{empty}</div>}
      {pieces.map((pc) => {
        const p = product(pc.productId);
        return p ? <img key={pc.id} src={p.imageUrl} alt={p.name} style={{ left: `${pc.x}%`, top: `${pc.y}%`, width: `${pc.w}%` }} /> : null;
      })}
    </div>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <>{children}</>;
}

export function SectionHead({ eyebrow, title, wink, action }: { eyebrow?: string; title: string; wink?: string; action?: ReactNode }) {
  return (
    <div className="row between wrap" style={{ alignItems: 'flex-end', marginBottom: 24, gap: 16 }}>
      <div className="stack" style={{ gap: 8 }}>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2 className="h2">
          {title} {wink && <span className="wink">{wink}</span>}
        </h2>
      </div>
      {action}
    </div>
  );
}
