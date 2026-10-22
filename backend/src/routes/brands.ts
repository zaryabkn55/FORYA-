import { Router, Request, Response } from 'express';
import { prisma } from '../db/config';
import { proxiedImage } from '../services/imageUrl';

const router = Router();

// GET /api/brands
router.get('/', async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Group products by brand for Canvas sidebar
    const brandMap: Record<string, any[]> = {};
    for (const p of products) {
      if (!brandMap[p.brand]) {
        brandMap[p.brand] = [];
      }
      brandMap[p.brand].push({
        id: p.id,
        productId: p.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        price: p.price,
        imageUrl: proxiedImage(p.imageUrl),
        color: p.color,
      });
    }

    res.json(brandMap);
  } catch (err: any) {
    console.error('Fetch brands error:', err);
    res.status(500).json({ error: 'Could not fetch brands catalog.' });
  }
});

export default router;