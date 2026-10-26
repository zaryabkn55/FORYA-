import { Router, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '../db/config';
import { AuthRequest, requireAuth } from '../middlewares/auth';
import { toProduct } from '../lib/mappers';
import { MAX_IMAGE_BYTES, readPng } from '../services/pngInfo';

const router = Router();
router.use(requireAuth);

async function list(userId: string) {
  const items = await prisma.wardrobeItem.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  return items.map((i: { productId: string; owned: boolean; createdAt: Date; timesWorn: number }) => ({
    productId: i.productId,
    kind: i.owned ? 'owned' : 'saved',
    addedAt: i.createdAt.toISOString(),
    timesWorn: i.owned ? i.timesWorn : undefined,
  }));
}

// GET /api/wardrobe — everything the user has saved or owns
router.get('/', async (req: AuthRequest, res: Response) => {
  res.json(await list(req.user!.id));
});

/**
 * GET /api/wardrobe/pieces — the member's own photographed pieces, as products.
 *
 * These are deliberately absent from /api/products, which is the public catalogue, so the client
 * fetches them here and merges them into its product list. Without this the wardrobe would hold
 * ids it cannot resolve.
 */
router.get('/pieces', async (req: AuthRequest, res: Response) => {
  const mine = await prisma.product.findMany({
    where: { ownerId: req.user!.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json(mine.map(toProduct));
});

const CATEGORIES = ['Tops', 'Knitwear', 'Jacket', 'Outerwear', 'Trousers', 'Bottoms', 'Dresses', 'Shoes', 'Bags', 'Accessories', 'Tailoring'] as const;

const CaptureSchema = z.object({
  name: z.string().trim().min(1, 'Give the piece a name.').max(80),
  category: z.enum(CATEGORIES),
  colorName: z.string().trim().max(40).optional(),
  /** The cut-out, as a base64 PNG with transparency. No data: prefix. */
  image: z.string().min(64),
  /** False when the device could not lift the subject and the original was kept instead. */
  backgroundRemoved: z.boolean().optional().default(true),
});

/**
 * POST /api/wardrobe/capture — add a piece the member photographed.
 *
 * The cut-out is made on the phone, where the platform does it in well under a second and for
 * free. Doing it here would mean a 1GB model in a 512MB container, which is why the server only
 * validates and stores.
 *
 * The piece is saved as a Product owned by this member, so it behaves like any catalogue piece in
 * looks, on the canvas and in the wardrobe, while staying out of Discover.
 */
router.post('/capture', async (req: AuthRequest, res: Response) => {
  const parsed = CaptureSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'That piece could not be read.' });

  const { name, category, colorName, image, backgroundRemoved } = parsed.data;
  const userId = req.user!.id;

  let buf: Buffer;
  try {
    buf = Buffer.from(image, 'base64');
  } catch {
    return res.status(400).json({ error: 'That photo could not be read.' });
  }
  if (buf.length > MAX_IMAGE_BYTES) return res.status(413).json({ error: 'That photo is too large.' });

  const png = readPng(buf);
  if (!png.ok) return res.status(400).json({ error: png.reason });

  // A soft ceiling: a wardrobe is personal, not a bucket. Stops one account filling the database.
  const existing = await prisma.product.count({ where: { ownerId: userId } });
  if (existing >= 300) {
    return res.status(409).json({ error: 'Your wardrobe is full. Remove a piece before adding another.' });
  }

  const id = randomUUID();
  const product = await prisma.product.create({
    data: {
      id,
      sku: `OWN-${id.slice(0, 12)}`,
      name,
      brand: 'My wardrobe',
      tier: 'AFFORDABLE',
      category,
      price: '',
      numericPrice: 0,
      imageUrl: `/api/wardrobe/items/${id}/image`,
      color: colorName?.toLowerCase() ?? 'unknown',
      colorName: colorName || undefined,
      description: backgroundRemoved ? undefined : 'Photographed without a cut-out background.',
      gender: 'unisex',
      ownerId: userId,
      image: {
        create: { bytes: buf, contentType: 'image/png', width: png.info.width, height: png.info.height },
      },
    },
  });

  // A photographed piece is something you own, by definition.
  await prisma.wardrobeItem.upsert({
    where: { userId_productId: { userId, productId: id } },
    update: { owned: true },
    create: { userId, productId: id, owned: true },
  });

  res.status(201).json({ product: toProduct(product), wardrobe: await list(userId) });
});

/**
 * GET /api/wardrobe/items/:productId/image — the stored cut-out.
 *
 * Authenticated and owner-scoped: these are photographs of someone's home and belongings, so an
 * unguessable URL is not good enough. A stranger with the id gets the same 404 as a stranger
 * without it, so the route never confirms that a piece exists.
 */
router.get('/items/:productId/image', async (req: AuthRequest, res: Response) => {
  const row = await prisma.productImage.findUnique({
    where: { productId: req.params.productId },
    include: { product: { select: { ownerId: true } } },
  });
  if (!row || row.product.ownerId !== req.user!.id) return res.status(404).json({ error: 'Not found.' });

  res.setHeader('Content-Type', row.contentType);
  res.setHeader('Content-Length', String(row.bytes.length));
  // The bytes behind an id never change, so this can be cached hard — but privately: a shared
  // proxy must not hold one member's wardrobe for another.
  res.setHeader('Cache-Control', 'private, max-age=31536000, immutable');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self' data:; sandbox");
  res.end(Buffer.from(row.bytes));
});

/** DELETE /api/wardrobe/items/:productId — remove a photographed piece and its image. */
router.delete('/items/:productId', async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const product = await prisma.product.findUnique({ where: { id: req.params.productId }, select: { ownerId: true } });
  if (!product || product.ownerId !== userId) return res.status(404).json({ error: 'Not found.' });

  // The image row and the wardrobe entry both cascade from the product.
  await prisma.product.delete({ where: { id: req.params.productId } });
  res.json(await list(userId));
});

// PUT /api/wardrobe/:productId { kind: 'saved' | 'owned' | null }
router.put('/:productId', async (req: AuthRequest, res: Response) => {
  const parsed = z.object({ kind: z.enum(['saved', 'owned']).nullable() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Choose saved, owned or null.' });
  const userId = req.user!.id;
  const { productId } = req.params;
  const where = { userId_productId: { userId, productId } };

  if (parsed.data.kind === null) {
    await prisma.wardrobeItem.deleteMany({ where: { userId, productId } });
  } else {
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, ownerId: true } });
    if (!product) return res.status(404).json({ error: 'That piece no longer exists.' });
    // Someone else's photographed piece is not theirs to save.
    if (product.ownerId && product.ownerId !== userId) return res.status(404).json({ error: 'That piece no longer exists.' });
    const owned = parsed.data.kind === 'owned';
    await prisma.wardrobeItem.upsert({ where, update: { owned }, create: { userId, productId, owned } });
  }
  res.json(await list(userId));
});

export default router;
