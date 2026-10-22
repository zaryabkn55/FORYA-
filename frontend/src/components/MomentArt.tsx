/**
 * The drawn panel behind a moment: a tinted field, a quiet pattern for the occasion, and one large line
 * figure for the forecast. No photography, so it works for any moment a customer can think of.
 * See lib/momentArt.ts for how the three layers are chosen.
 */
import type { ReactNode } from 'react';
import { artStyle, type ArtSky, type MomentArt as Art } from '../lib/momentArt';

const RAYS = Array.from({ length: 8 }, (_, i) => {
  const a = (i * Math.PI) / 4;
  return { x1: 50 + Math.cos(a) * 32, y1: 50 + Math.sin(a) * 32, x2: 50 + Math.cos(a) * 45, y2: 50 + Math.sin(a) * 45 };
});

const CLOUD = 'M18 62C9 62 7 50 17 47C16 32 37 26 45 37C51 29 65 31 66 43C77 42 81 55 72 62Z';

function Sky({ sky }: { sky: ArtSky }) {
  return (
    <svg className="m-art-sky" data-sky={sky} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      {sky === 'sun' && (
        <>
          <circle cx="50" cy="50" r="24" />
          {RAYS.map((r, i) => (
            <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} />
          ))}
        </>
      )}
      {sky === 'moon' && <path d="M64 17A34 34 0 1 0 64 83A27 27 0 1 1 64 17Z" />}
      {sky === 'cloud' && (
        <>
          <path d={CLOUD} />
          <path d="M30 74h34" opacity="0.5" />
        </>
      )}
      {sky === 'rain' && (
        <>
          <path d={CLOUD} transform="translate(0,-6)" />
          {[28, 44, 60].map((x) => (
            <line key={x} x1={x} y1={64} x2={x - 6} y2={82} />
          ))}
        </>
      )}
      {sky === 'snow' && (
        <>
          <path d={CLOUD} transform="translate(0,-6)" />
          {[
            [28, 70],
            [45, 78],
            [61, 70],
          ].map(([x, y]) => (
            <g key={x} transform={`translate(${x} ${y})`}>
              <line x1={-5} y1={0} x2={5} y2={0} />
              <line x1={0} y1={-5} x2={0} y2={5} />
            </g>
          ))}
        </>
      )}
      {sky === 'wind' && (
        <>
          <path d="M10 38C32 27 56 31 72 38" />
          <path d="M18 54C42 43 66 47 84 54" />
          <path d="M28 70C48 61 64 63 76 68" opacity="0.6" />
        </>
      )}
    </svg>
  );
}

/** A moment's field. Anything passed as children sits on top of it. */
export function MomentArt({ art, className = '', children }: { art: Art; className?: string; children?: ReactNode }) {
  return (
    <div className={`m-art ${className}`.trim()} data-texture={art.texture} style={artStyle(art)}>
      <Sky sky={art.sky} />
      {children}
    </div>
  );
}
