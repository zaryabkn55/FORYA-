import { Link } from 'react-router-dom';

/** FOR (Bricolage Grotesque ExtraBold) + ya (Instrument Serif Italic). Never retype it by hand. */
export function Wordmark({ size = 28, tone = 'ink' }: { size?: number; tone?: 'ink' | 'paper' }) {
  return (
    <span className="logo" style={{ fontSize: size, color: tone === 'paper' ? 'var(--paper)' : 'var(--ink)' }} aria-label="FORYA">
      <span className="logo-for" aria-hidden>
        FOR
      </span>
      <span className="logo-ya" aria-hidden>
        ya
      </span>
    </span>
  );
}

export function Logo({ to = '/', size = 28 }: { to?: string; size?: number }) {
  return (
    <Link to={to} className="logo" aria-label="FORYA home">
      <Wordmark size={size} />
    </Link>
  );
}
