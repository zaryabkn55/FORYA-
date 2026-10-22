/**
 * POST /api/sync — calendar import.
 * Placeholder until Google / Outlook calendar OAuth is wired up: adds two sample moments, once per user.
 */
import { Router, Response } from 'express';
import { prisma } from '../db/config';
import { momentInclude, toMoment } from '../lib/mappers';
import { AuthRequest, requireAuth } from '../middlewares/auth';

const router = Router();

const inDays = (n: number, hour: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, 0, 0, 0);
  return d;
};

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const already = await prisma.moment.count({ where: { userId, source: 'CALENDAR' } });
  if (already) return res.json({ added: [] });

  const samples = [
    { title: 'Leaving drinks', occasion: 'PARTY' as const, date: inDays(7, 18), venue: 'Shoreditch, London' },
    { title: 'Client lunch', occasion: 'WORK' as const, date: inDays(12, 13), venue: 'Fitzrovia, London' },
  ];
  const added = [];
  for (const s of samples) {
    added.push(await prisma.moment.create({ data: { ...s, userId, source: 'CALENDAR', look: { create: { status: 'DRAFT' } } }, include: momentInclude }));
  }
  res.json({ added: added.map(toMoment) });
});

export default router;
