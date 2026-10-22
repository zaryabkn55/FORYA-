import { CSSProperties, ReactNode, useState } from 'react';

/** An editorial photo that fades in once loaded and keeps an oat placeholder while it does. */
export function Photo({
  src,
  alt,
  ratio,
  radius,
  className = '',
  style,
  zoom,
  children,
  position,
  eager,
}: {
  src: string;
  alt: string;
  ratio?: string;
  radius?: number | string;
  className?: string;
  style?: CSSProperties;
  zoom?: boolean;
  children?: ReactNode;
  position?: string;
  /** Load straight away (above-the-fold images). */
  eager?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div
      className={`photo ${loaded ? '' : 'is-loading'} ${zoom ? 'photo-zoom' : ''} ${className}`}
      style={{ aspectRatio: ratio, borderRadius: radius, ...style }}
    >
      <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" onLoad={() => setLoaded(true)} style={{ objectPosition: position }} />
      {children}
    </div>
  );
}
