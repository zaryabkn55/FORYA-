/**
 * Shared looks.
 *  POST /api/shared              (auth) { momentId } → { id }   one link per moment, refreshed on each share
 *  GET  /api/shared/:id          public → { look, reactions }
 *  POST /api/shared/:id/react    public { reaction, previous? } → { reactions }
 */
import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../db/config';
import { momentInclude, toMoment } from '../lib/mappers';
import { AuthRequest, requireAuth } from '../middlewares/auth';

const router = Router();
const REACTIONS = ['wear', 'obsessed', 'swap'] as const;
type Reaction = (typeof REACTIONS)[number];

const counts = (s: { wear: number; obsessed: number; swap: number }) => ({ wear: s.wear, obsessed: s.obsessed, swap: s.swap });
const shortId = () => crypto.randomBytes(6).toString('base64url');

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = z.object({ momentId: z.string() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Choose a moment to share.' });
  const userId = req.user!.id;
  const m = await prisma.moment.findFirst({ where: { id: parsed.data.momentId, userId }, include: momentInclude });
  if (!m) return res.status(404).json({ error: 'This moment no longer exists.' });
  const moment = toMoment(m);
  const snapshot = { title: moment.title, occasion: moment.occasion, date: moment.date, by: req.user!.name.split(' ')[0], weather: moment.weather, pieces: moment.look.pieces };
  const shared = await prisma.sharedLook.upsert({
    where: { userId_momentId: { userId, momentId: m.id } },
    update: { snapshot },
    create: { id: shortId(), userId, momentId: m.id, snapshot },
  });
  res.json({ id: shared.id });
});

router.get('/:id', async (req: Request, res: Response) => {
  const s = await prisma.sharedLook.findUnique({ where: { id: req.params.id } });
  if (!s) return res.status(404).json({ error: 'This look is no longer shared.' });
  res.json({ look: s.snapshot, reactions: counts(s) });
});

// Reactions are anonymous. The browser remembers its own choice and sends `previous` when it changes its mind.
router.post('/:id/react', async (req: Request, res: Response) => {
  const parsed = z.object({ reaction: z.enum(REACTIONS), previous: z.enum(REACTIONS).optional() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Unknown reaction.' });
  const { reaction, previous } = parsed.data;
  const data: Partial<Record<Reaction, { increment: number } | { decrement: number }>> = {};
  if (previous === reaction) data[reaction] = { decrement: 1 };
  else {
    data[reaction] = { increment: 1 };
    if (previous) data[previous] = { decrement: 1 };
  }
  const s = await prisma.sharedLook.update({ where: { id: req.params.id }, data }).catch(() => null);
  if (!s) return res.status(404).json({ error: 'This look is no longer shared.' });
  res.json({ reactions: counts(s), mine: previous === reaction ? undefined : reaction });
});

export default router;
