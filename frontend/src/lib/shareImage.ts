/**
 * Renders a look as a branded image for Instagram (feed 1080×1350 or story 1080×1920).
 * Product shots are multiplied onto the oat canvas exactly as in the app.
 */
import { money, momentHeadline } from './format';
import type { Moment, Product } from './types';

export type ImageFormat = 'post' | 'story';

const C = { paper: '#F6F5F2', sheet: '#F1EBE1', ink: '#2E2D2B', pebble: '#6E6B65', oat: '#E8DFD0' };

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error(`Couldn't load ${src}`));
    im.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function renderLookImage(m: Moment, product: (id: string) => Product | undefined, by: string, format: ImageFormat = 'post'): Promise<Blob> {
  const W = 1080;
  const H = format === 'story' ? 1920 : 1350;
  await Promise.all(
    ['800 40px "Bricolage Grotesque"', '700 40px "Bricolage Grotesque"', 'italic 40px "Instrument Serif"', '500 20px "Geist Mono"', '600 40px Caveat'].map((f) => document.fonts.load(f).catch(() => null)),
  );
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d')!;
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, W, H);

  const pad = 72;
  const top = format === 'story' ? 200 : 90;

  // Header: wordmark + date
  ctx.fillStyle = C.ink;
  ctx.textBaseline = 'alphabetic';
  ctx.font = '800 54px "Bricolage Grotesque", sans-serif';
  ctx.fillText('FOR', pad, top);
  const forW = ctx.measureText('FOR').width;
  ctx.font = 'italic 56px "Instrument Serif", serif';
  ctx.fillText('ya', pad + forW + 2, top);
  ctx.font = '500 22px "Geist Mono", monospace';
  ctx.fillStyle = C.pebble;
  const when = new Date(m.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();
  const tag = m.weather ? `${when} · ${m.weather.temperature}°` : when;
  ctx.textAlign = 'right';
  ctx.fillText(tag, W - pad, top - 6);
  ctx.textAlign = 'left';

  // Title
  ctx.fillStyle = C.ink;
  ctx.font = '700 78px "Bricolage Grotesque", sans-serif';
  const title = momentHeadline(m).replace(/\.$/, '');
  ctx.fillText(title, pad, top + 118, W - pad * 2);
  ctx.font = 'italic 52px "Instrument Serif", serif';
  ctx.fillText(`styled by ${by}.`, pad, top + 186);

  // Canvas
  const boxY = top + 236;
  const box = W - pad * 2;
  roundRect(ctx, pad, boxY, box, box, 44);
  ctx.fillStyle = C.sheet;
  ctx.fill();
  ctx.save();
  roundRect(ctx, pad, boxY, box, box, 44);
  ctx.clip();
  ctx.globalCompositeOperation = 'multiply';
  const pieces = [...m.look.pieces].sort((a, b) => a.z - b.z);
  for (const pc of pieces) {
    const p = product(pc.productId);
    if (!p) continue;
    const im = await loadImage(p.imageUrl);
    const w = (pc.w / 100) * box;
    const h = w * (im.naturalHeight / im.naturalWidth);
    ctx.drawImage(im, pad + (pc.x / 100) * box - w / 2, boxY + (pc.y / 100) * box - h / 2, w, h);
  }
  ctx.restore();

  // Footer: pieces and total
  const items = Array.from(new Set(m.look.pieces.map((p) => p.productId)))
    .map((id) => product(id))
    .filter((p): p is Product => !!p);
  const total = items.reduce((s, p) => s + p.price, 0);
  const fy = boxY + box + 74;
  ctx.fillStyle = C.ink;
  ctx.font = '600 34px "Bricolage Grotesque", sans-serif';
  ctx.fillText(`${items.length} piece${items.length === 1 ? '' : 's'} · ${money(total)}`, pad, fy);
  ctx.font = '500 22px "Geist Mono", monospace';
  ctx.fillStyle = C.pebble;
  const brands = Array.from(new Set(items.map((p) => p.brand))).slice(0, 4).join(' · ').toUpperCase();
  ctx.fillText(brands, pad, fy + 44, W - pad * 2);
  if (format === 'story') {
    ctx.fillStyle = C.ink;
    ctx.font = '600 44px Caveat, cursive';
    ctx.textAlign = 'center';
    ctx.fillText('Would you wear it? Tap the link ↑', W / 2, H - 170);
    ctx.textAlign = 'left';
  }
  ctx.font = '500 22px "Geist Mono", monospace';
  ctx.fillStyle = C.pebble;
  ctx.textAlign = 'right';
  ctx.fillText('STYLED ON FORYA', W - pad, fy);
  ctx.textAlign = 'left';

  return new Promise((resolve, reject) => cv.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not create the image.'))), 'image/png'));
}
