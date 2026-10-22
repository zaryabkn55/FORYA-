import type { Piece, Product } from './types';
import { uid } from './format';

type Slot = { x: number; y: number; w: number };

/** Where a piece sits in a head-to-toe flat lay. Canvas is square; values are % of its size. */
export function slotFor(p: Product): Slot {
  const name = p.name.toLowerCase();
  switch (p.category) {
    case 'Outerwear':
      return { x: 77, y: 34, w: 28 };
    case 'Tailoring':
      return /trouser|pant/.test(name) ? { x: 50, y: 60, w: 27 } : { x: 77, y: 30, w: 27 };
    case 'Tops':
    case 'Knitwear':
      return { x: 50, y: 23, w: 29 };
    case 'Dresses':
      return { x: 50, y: 40, w: 31 };
    case 'Bottoms':
      return { x: 50, y: 60, w: 27 };
    case 'Shoes':
      return { x: 50, y: 87, w: 21 };
    case 'Bags':
      return { x: 22, y: 64, w: 24 };
    default:
      return { x: 22, y: 36, w: 20 };
  }
}

/** Place a new piece in its natural slot, nudging sideways if that slot is taken. */
export function placePiece(product: Product, existing: Piece[], at?: { x: number; y: number }): Piece {
  const slot = slotFor(product);
  let { x, y } = at ?? slot;
  if (!at) {
    const taken = (px: number, py: number) => existing.some((e) => Math.abs(e.x - px) < 8 && Math.abs(e.y - py) < 8);
    // Side pieces (outerwear, bags, accessories) try the mirror-image side before crowding the centre.
    const xs = slot.x === 50 ? [50, 24, 76, 37, 63] : [slot.x, 100 - slot.x, slot.x + (slot.x > 50 ? -13 : 13), 50];
    for (const tx of xs) {
      const cx = Math.min(85, Math.max(15, tx));
      if (!taken(cx, y)) {
        x = cx;
        break;
      }
    }
  }
  const z = existing.reduce((m, e) => Math.max(m, e.z), 0) + 1;
  return { id: uid('pc'), productId: product.id, x, y, w: slot.w, z };
}

/** "Tidy up": lay every piece out head to toe, keeping each piece's identity. */
export function tidy(pieces: Piece[], lookup: (id: string) => Product | undefined): Piece[] {
  const out: Piece[] = [];
  const ordered = [...pieces].sort((a, b) => (slotRank(lookup(a.productId)) - slotRank(lookup(b.productId))));
  for (const piece of ordered) {
    const product = lookup(piece.productId);
    if (!product) {
      out.push(piece);
      continue;
    }
    const placed = placePiece(product, out);
    out.push({ ...piece, x: placed.x, y: placed.y, w: placed.w, z: out.length + 1 });
  }
  return out;
}

function slotRank(p?: Product) {
  if (!p) return 99;
  const order = ['Tops', 'Knitwear', 'Dresses', 'Tailoring', 'Bottoms', 'Outerwear', 'Accessories', 'Bags', 'Shoes'];
  return order.indexOf(p.category);
}

export function buildLook(products: Product[]): Piece[] {
  const pieces: Piece[] = [];
  for (const p of products) pieces.push(placePiece(p, pieces));
  return pieces;
}
