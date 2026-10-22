import { Router, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../db/config';
import { momentInclude, occasionIn, statusIn, toMoment } from '../lib/mappers';
import { AuthRequest, requireAuth } from '../middlewares/auth';

const router = Router();
router.use(requireAuth);

const MomentInput = z.object({
  title: z.string().trim().min(1, 'Give your moment a name.').max(120),
  occasion: z.string().optional(),
  date: z.string().datetime({ offset: true }),
  venue: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  weather: z.object({ temperature: z.number(), condition: z.string() }).optional(),
});

const LookInput = z.object({
  status: z.enum(['draft', 'in-progress', 'ready']),
  pieces: z
    .array(z.object({ productId: z.string(), x: z.number(), y: z.number(), w: z.number(), z: z.number().int() }))
    .max(60),
});

const own = (req: AuthRequest) => ({ id: req.params.id, userId: req.user!.id });

// GET /api/moments
router.get('/', async (req: AuthRequest, res: Response) => {
  const moments = await prisma.moment.findMany({ where: { userId: req.user!.id }, include: momentInclude, orderBy: { date: 'asc' } });
  res.json(moments.map(toMoment));
});

// GET /api/moments/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const m = await prisma.moment.findFirst({ where: own(req), include: momentInclude });
  if (!m) return res.status(404).json({ error: 'This moment no longer exists.' });
  res.json(toMoment(m));
});

// POST /api/moments
router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = MomentInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
  const { title, occasion, date, venue, notes, weather } = parsed.data;
  const m = await prisma.moment.create({
    data: {
      userId: req.user!.id,
      title,
      occasion: occasionIn(occasion),
      date: new Date(date),
      venue,
      notes,
      weatherTemp: weather ? Math.round(weather.temperature) : null,
      weatherDesc: weather?.condition,
      source: 'USER',
      look: { create: { status: 'DRAFT' } },
    },
    include: momentInclude,
  });
  res.status(201).json(toMoment(m));
});

// PUT /api/moments/:id/look — replaces the canvas (positions, sizes and stacking are kept as sent)
router.put('/:id/look', async (req: AuthRequest, res: Response) => {
  const parsed = LookInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'That look could not be saved.' });
  const m = await prisma.moment.findFirst({ where: own(req), include: { look: true } });
  if (!m) return res.status(404).json({ error: 'This moment no longer exists.' });

  const { status, pieces } = parsed.data;
  const products = await prisma.product.findMany({ where: { id: { in: pieces.map((p) => p.productId) } }, select: { id: true, numericPrice: true } });
  const price = new Map<string, number>(products.map((p: { id: string; numericPrice: number }) => [p.id, p.numericPrice]));
  const valid = pieces.filter((p) => price.has(p.productId));
  const total = [...new Set(valid.map((p) => p.productId))].reduce((s, id) => s + (price.get(id) ?? 0), 0);

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const look = m.look ?? (await tx.look.create({ data: { momentId: m.id } }));
    await tx.canvasPiece.deleteMany({ where: { lookId: look.id } });
    if (valid.length) await tx.canvasPiece.createMany({ data: valid.map((p) => ({ lookId: look.id, productId: p.productId, x: p.x, y: p.y, w: p.w, z: p.z })) });
    await tx.look.update({ where: { id: look.id }, data: { status: statusIn(status), total } });
  });

  const updated = await prisma.moment.findFirst({ where: own(req), include: momentInclude });
  res.json(toMoment(updated));
});

// DELETE /api/moments/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const { count } = await prisma.moment.deleteMany({ where: own(req) });
  if (!count) return res.status(404).json({ error: 'This moment no longer exists.' });
  res.status(204).end();
});

export default router;
