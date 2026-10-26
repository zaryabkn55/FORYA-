import { Router, Request, Response } from 'express';
import { prisma } from '../db/config';
import { scrapeRetailerProduct, syncAllCategorizedBrands } from '../services/scraper';
import axios from 'axios';
import { toProduct } from '../lib/mappers';
import { priceCheck } from '../lib/pricing';
import { requireAdmin } from '../middlewares/auth';
import { MAX_IMAGE_BYTES, checkImageUrl, safeImageContentType } from '../services/imageProxy';

const router = Router();

// GET /api/products
router.get('/', async (req: Request, res: Response) => {
  const { q, tier, category, brand } = req.query;

  try {
    // ownerId: null keeps members' own photographed pieces out of the public catalogue.
    // They live in the same table so they work in looks and on the canvas, but Discover,
    // search and the brand pages are the shared catalogue only.
    const where: any = { ownerId: null };

    if (tier && tier !== 'All') {
      where.tier = String(tier).toUpperCase();
    }

    if (category && category !== 'All Categories') {
      where.category = { equals: String(category), mode: 'insensitive' };
    }

    if (brand && brand !== 'All Brands') {
      where.brand = { equals: String(brand), mode: 'insensitive' };
    }

    if (q) {
      const queryStr = String(q);
      where.OR = [
        { name: { contains: queryStr, mode: 'insensitive' } },
        { brand: { contains: queryStr, mode: 'insensitive' } },
        { sku: { contains: queryStr, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(products.map(toProduct));
  } catch (err: any) {
    console.error('Products fetch error:', err);
    res.status(500).json({ error: 'Could not fetch catalog products.' });
  }
});

// POST /api/products/sync-all-brands (Ingests all 57 brands into PostgreSQL)
// Operator-only: spends scraping credits and puts load on retailers' sites.
router.post('/sync-all-brands', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const items = await syncAllCategorizedBrands();
    let synced = 0;

    for (const item of items) {
      await prisma.product.upsert({
        where: { sku: item.sku },
        update: {
          price: item.price,
          numericPrice: item.numericPrice,
          imageUrl: item.imageUrl,
          tier: item.tier as any,
          category: item.category,
        },
        create: {
          sku: item.sku,
          name: item.name,
          brand: item.brand,
          tier: item.tier as any,
          category: item.category,
          price: item.price,
          numericPrice: item.numericPrice,
          imageUrl: item.imageUrl,
          color: item.color,
          colorName: item.colorName,
          material: item.material,
          description: item.description,
          sourceUrl: item.sourceUrl,
          isNew: true,
        },
      });
      synced++;
    }

    res.json({
      success: true,
      message: `Successfully ingested 57 brands across Affordable, Attainable, and Aspirational tiers.`,
      count: synced,
    });
  } catch (err: any) {
    console.error('Bulk sync error:', err);
    res.status(500).json({ error: 'Failed to ingest brand catalog.' });
  }
});

// POST /api/products/ingest-live (Live scrape a single URL)
// Operator-only: same reason as sync-all-brands.
router.post('/ingest-live', requireAdmin, async (req: Request, res: Response) => {
  const { url, category } = req.body;
  if (!url) return res.status(400).json({ error: 'Product URL is required.' });

  try {
    const scraped = await scrapeRetailerProduct(url, category || 'Tops');
    if (!scraped) {
      return res.status(422).json({ error: 'Unable to extract data from product link.' });
    }

    const product = await prisma.product.upsert({
      where: { sku: scraped.sku },
      update: {
        price: scraped.price,
        numericPrice: scraped.numericPrice,
        imageUrl: scraped.imageUrl,
      },
      create: {
        sku: scraped.sku,
        name: scraped.name,
        brand: scraped.brand,
        tier: scraped.tier as any,
        category: scraped.category,
        price: scraped.price,
        numericPrice: scraped.numericPrice,
        imageUrl: scraped.imageUrl,
        color: scraped.color,
        colorName: scraped.colorName,
        material: scraped.material,
        description: scraped.description,
        sourceUrl: scraped.sourceUrl,
        isNew: true,
      },
    });

    res.status(201).json({ success: true, data: product });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Scraping failed.' });
  }
});

// GET /api/products/proxy-image?url=...
// Retailer CDNs block hotlinking, so images come through here. Every URL is vetted first —
// see services/imageProxy — because an unchecked fetcher is an open proxy into the private
// network. Failures are a flat 404: the browser just shows the fallback tile.
router.get('/proxy-image', async (req: Request, res: Response) => {
  const imageUrl = typeof req.query.url === 'string' ? req.query.url : '';
  if (!imageUrl) return res.status(400).send('Image URL required');

  const check = await checkImageUrl(imageUrl);
  if (!check.ok) {
    console.warn('[proxy-image] refused:', check.reason);
    return res.status(400).end();
  }

  try {
    const response = await axios.get(check.url.toString(), {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/*;q=0.8',
        Referer: check.url.origin,
      },
      timeout: 10_000,
      maxContentLength: MAX_IMAGE_BYTES,
      maxBodyLength: MAX_IMAGE_BYTES,
      // Don't chase a redirect off the vetted host into something private.
      maxRedirects: 0,
      validateStatus: (s) => s >= 200 && s < 300,
    });

    const contentType = safeImageContentType(response.headers['content-type']);
    if (!contentType) {
      console.warn('[proxy-image] upstream did not return an image');
      return res.status(415).end();
    }

    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=86400, immutable');
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Content-Security-Policy', "default-src 'none'; sandbox");
    res.send(Buffer.from(response.data));
  } catch {
    res.status(404).end();
  }
});

// GET /api/products/:id
router.get('/:id', async (req: Request, res: Response) => {
  const p = await prisma.product.findFirst({ where: { id: req.params.id, ownerId: null } });
  if (!p) return res.status(404).json({ error: 'Product not found.' });
  res.json(toProduct(p));
});

// GET /api/products/:id/prices — price verdict + offers across retailers and resale
router.get('/:id/prices', async (req: Request, res: Response) => {
  const p = await prisma.product.findFirst({ where: { id: req.params.id, ownerId: null } });
  if (!p) return res.status(404).json({ error: 'Product not found.' });
  const out = toProduct(p);
  res.json(priceCheck({ id: out.id, brand: out.brand, tier: out.tier, price: out.price, sourceUrl: out.sourceUrl }));
});

export default router;