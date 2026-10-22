import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/config';
import { AuthRequest, requireAuth } from '../middlewares/auth';

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
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) return res.status(404).json({ error: 'That piece no longer exists.' });
    const owned = parsed.data.kind === 'owned';
    await prisma.wardrobeItem.upsert({ where, update: { owned }, create: { userId, productId, owned } });
  }
  res.json(await list(userId));
});

export default router;
