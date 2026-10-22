/**
 * npm run seed — loads the FORYA starter catalogue and a demo account.
 * Demo logins: demo@forya.com (womenswear) and james@forya.com (menswear), both forya-demo-2026
 */
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { FORYA_CATALOGUE } from '../src/lib/foryaCatalogue';

const prisma = new PrismaClient();

const inDays = (n: number, hour: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, 0, 0, 0);
  return d;
};

// Head-to-toe layout on the square canvas (matches frontend/src/lib/layout.ts).
const SLOT: Record<string, { x: number; y: number; w: number }> = {
  Tops: { x: 50, y: 23, w: 29 },
  Knitwear: { x: 50, y: 23, w: 29 },
  Jacket: { x: 77, y: 30, w: 27 },
  Trousers: { x: 50, y: 60, w: 27 },
  Bottoms: { x: 50, y: 60, w: 27 },
  Dresses: { x: 50, y: 40, w: 31 },
  Outerwear: { x: 77, y: 34, w: 28 },
  Shoes: { x: 50, y: 87, w: 21 },
  Bags: { x: 22, y: 64, w: 24 },
  Accessories: { x: 22, y: 36, w: 20 },
};
const slot = (category: string, name: string) =>
  category === 'Tailoring' ? (/trouser/i.test(name) ? SLOT.Trousers : SLOT.Jacket) : SLOT[category] ?? SLOT.Accessories;

async function main() {
  const bySku = new Map<string, { id: string; category: string; name: string }>();
  for (const p of FORYA_CATALOGUE) {
    const data = {
      name: p.name,
      brand: p.brand,
      tier: p.tier,
      category: p.category,
      price: `£${p.price}`,
      numericPrice: p.price,
      imageUrl: p.image,
      color: p.colorName,
      colorName: p.colorName,
      material: p.material,
      description: p.description,
      isNew: p.isNew,
      weather: p.weather,
      rainReady: p.rainReady,
      isStore: p.isStore,
      gender: p.gender,
    };
    const row = await prisma.product.upsert({ where: { sku: p.sku }, update: data, create: { sku: p.sku, ...data } });
    bySku.set(p.sku, row);
  }
  console.log(`Catalogue: ${FORYA_CATALOGUE.length} products.`);

  await seedMenswearDemo(bySku);

  const email = 'demo@forya.com';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return console.log('Demo user already exists, leaving their data alone.');

  const user = await prisma.user.create({
    data: { fullName: 'Celine', email, passwordHash: await bcrypt.hash('forya-demo-2026', 10), country: 'United Kingdom', countryCode: 'GB', shopsFor: 'women' },
  });

  const pieces = (...skus: string[]) =>
    skus.map((sku, i) => {
      const p = bySku.get(sku)!;
      return { productId: p.id, ...slot(p.category, p.name), z: i + 1 };
    });

  const moments = [
    { title: 'Wedding', occasion: 'FORMAL', date: inDays(3, 14), venue: 'Babington House, Somerset', source: 'CALENDAR', weatherTemp: 19, weatherDesc: 'Partly cloudy', status: 'IN_PROGRESS', pieces: pieces('ZAR-LIN-SHT-WHT', 'ZAR-LIN-BLZ-SND', 'ZAR-LIN-TRS-SND', 'MNG-LTH-BLT-BRN', 'MD-SUE-LOF-CHC') },
    { title: 'Interview', occasion: 'WORK', date: inDays(5, 10), venue: "King's Cross, London", source: 'CALENDAR', weatherTemp: 14, weatherDesc: 'Overcast', status: 'DRAFT', pieces: [] },
    { title: 'Dinner in Mayfair', occasion: 'DINNER', date: inDays(9, 20), venue: 'Mount Street, London', source: 'USER', weatherTemp: 11, weatherDesc: 'Light rain', status: 'IN_PROGRESS', pieces: pieces('SAN-SLK-SHT-IVR', 'REI-WOL-BLZ-NVY', 'COS-WOL-TRS-CHR') },
    { title: 'Lisbon trip', occasion: 'HOLIDAY', date: inDays(18, 9), venue: 'Lisbon, Portugal', source: 'USER', weatherTemp: 26, weatherDesc: 'Clear sky', status: 'READY', pieces: pieces('ZAR-LIN-SHT-WHT', 'ZAR-LIN-TRS-SND', 'COS-LTH-TOT-TPE', 'MNG-LTH-TRN-WHT') },
    { title: 'Work trip to Edinburgh', occasion: 'WORK', date: inDays(14, 8), venue: 'Edinburgh, Scotland', source: 'CALENDAR', weatherTemp: 8, weatherDesc: 'Light rain', status: 'IN_PROGRESS', pieces: pieces('UNQ-MER-CRW-GRY', 'COS-WOL-TRS-CHR', 'AS-SUE-CHL-BLK', 'HM-WOL-COT-CML') },
    { title: 'Gallery private view', occasion: 'PARTY', date: inDays(24, 19), venue: 'Bankside, London', source: 'CALENDAR', weatherTemp: 6, weatherDesc: 'Clear sky', status: 'DRAFT', pieces: [] },
  ] as const;

  for (const { status, pieces: ps, ...m } of moments) {
    await prisma.moment.create({ data: { ...m, userId: user.id, look: { create: { status, pieces: { create: [...ps] } } } } });
  }

  const wardrobe: [string, boolean, number][] = [
    ['MNG-LTH-BLT-BRN', true, 14],
    ['MNG-LTH-TRN-WHT', true, 31],
    ['COS-WOL-TRS-CHR', true, 6],
    ['MD-SUE-LOF-CHC', false, 0],
    ['ASO-TRN-COT-STN', false, 0],
    ['MD-CSH-CRW-CML', false, 0],
    ['MAJ-FLR-DRS-BLU', false, 0],
    ['FEN-LTH-BAG-CRM', false, 0],
  ];
  for (const [sku, owned, timesWorn] of wardrobe) {
    await prisma.wardrobeItem.create({ data: { userId: user.id, productId: bySku.get(sku)!.id, owned, timesWorn } });
  }
  console.log('Demo user: demo@forya.com / forya-demo-2026');
}

/** James: the same week, dressed from the menswear catalogue. */
async function seedMenswearDemo(bySku: Map<string, { id: string; category: string; name: string }>) {
  const email = 'james@forya.com';
  if (await prisma.user.findUnique({ where: { email } })) return console.log('Menswear demo user already exists.');
  const user = await prisma.user.create({
    data: { fullName: 'James', email, passwordHash: await bcrypt.hash('forya-demo-2026', 10), country: 'United Kingdom', countryCode: 'GB', shopsFor: 'men' },
  });
  const pieces = (...skus: string[]) =>
    skus.map((sku, i) => {
      const p = bySku.get(sku)!;
      return { productId: p.id, ...slot(p.category, p.name), z: i + 1 };
    });
  const moments = [
    { title: 'Wedding', occasion: 'FORMAL', date: inDays(3, 14), venue: 'Babington House, Somerset', source: 'CALENDAR', weatherTemp: 19, weatherDesc: 'Partly cloudy', status: 'IN_PROGRESS', pieces: pieces('M-REIS-GREYSU-SOF', 'M-MANG-OXFORD-LIG', 'M-REIS-SUITTR-CHA', 'M-NEXT-DERBYS-BLA') },
    { title: 'Interview', occasion: 'WORK', date: inDays(5, 10), venue: "King's Cross, London", source: 'CALENDAR', weatherTemp: 14, weatherDesc: 'Overcast', status: 'DRAFT', pieces: [] },
    { title: 'Dinner in Mayfair', occasion: 'DINNER', date: inDays(9, 20), venue: 'Mount Street, London', source: 'USER', weatherTemp: 11, weatherDesc: 'Light rain', status: 'IN_PROGRESS', pieces: pieces('M-THEO-NAVYBL-NAV', 'M-UNIQ-ERINOC-GRE', 'M-7FOR-DARKJE-DAR') },
    { title: 'Lisbon trip', occasion: 'HOLIDAY', date: inDays(18, 9), venue: 'Lisbon, Portugal', source: 'USER', weatherTemp: 26, weatherDesc: 'Clear sky', status: 'READY', pieces: pieces('M-ZARA-CAMPSH-ECR', 'M-ZARA-LINEND-BEI', 'M-MASS-DRIVIN-SAN', 'M-GUCC-SUNGLA-TOR') },
    { title: 'Work trip to Edinburgh', occasion: 'WORK', date: inDays(14, 8), venue: 'Edinburgh, Scotland', source: 'CALENDAR', weatherTemp: 8, weatherDesc: 'Light rain', status: 'IN_PROGRESS', pieces: pieces('M-NEXT-OVERCO-CHA', 'M-UNIQ-ERINOC-GRE', 'M-REIS-SUITTR-CHA', 'M-ZADI-CHELSE-DAR') },
    { title: 'Gallery private view', occasion: 'PARTY', date: inDays(24, 19), venue: 'Bankside, London', source: 'CALENDAR', weatherTemp: 6, weatherDesc: 'Clear sky', status: 'DRAFT', pieces: [] },
  ] as const;
  for (const { status, pieces: ps, ...m } of moments) {
    await prisma.moment.create({ data: { ...m, userId: user.id, look: { create: { status, pieces: { create: [...ps] } } } } });
  }
  const wardrobe: [string, boolean, number][] = [
    ['MNG-LTH-BLT-BRN', true, 22],
    ['MNG-LTH-TRN-WHT', true, 40],
    ['M-NEXT-DERBYS-BLA', true, 9],
    ['M-UNIQ-ERINOC-GRE', true, 12],
    ['M-MASS-SUEDEB-TAN', false, 0],
    ['M-BOSS-OVERCO-CHA', false, 0],
    ['M-LORO-SUEDEL-CHO', false, 0],
    ['M-CLUB-LINENB-BEI', false, 0],
  ];
  for (const [sku, owned, timesWorn] of wardrobe) {
    await prisma.wardrobeItem.create({ data: { userId: user.id, productId: bySku.get(sku)!.id, owned, timesWorn } });
  }
  console.log('Menswear demo user: james@forya.com / forya-demo-2026');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
