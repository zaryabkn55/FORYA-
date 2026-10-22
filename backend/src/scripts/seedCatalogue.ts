/**
 * Loads the starter catalogue into whatever database DATABASE_URL points at.
 *
 *     npm run seed:catalogue        # from the Render/Railway shell, or locally
 *
 * This exists because `npm run seed` cannot run in the production image: it needs `tsx` (a dev
 * dependency, stripped by `npm ci --omit=dev`) and imports from `src/`, which the runtime stage
 * doesn't ship. This file lives under `src/`, so it compiles to `dist/scripts/seedCatalogue.js`
 * and ships with the image — plain node, no extra tooling.
 *
 * Products only, deliberately. `prisma/seed.ts` also creates two demo accounts whose password is
 * in version control, which has no business in a public deployment; seed those locally, or give
 * them fresh passwords first.
 *
 * Idempotent: every row is upserted on its SKU, so running it twice is harmless and running it
 * after a catalogue change updates the existing rows in place.
 */
import { PrismaClient } from '@prisma/client';
import { FORYA_CATALOGUE } from '../lib/foryaCatalogue';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const total = FORYA_CATALOGUE.length;
  console.log(`Seeding ${total} products…`);

  let created = 0;
  let updated = 0;

  for (const p of FORYA_CATALOGUE) {
    const data = {
      name: p.name,
      brand: p.brand,
      tier: p.tier,
      category: p.category,
      // Built here rather than typed into a shell: a £ pasted through a web terminal arrives as
      // mojibake, which is how the live catalogue once ended up with "GBP295" prices.
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

    const before = await prisma.product.findUnique({ where: { sku: p.sku }, select: { id: true } });
    await prisma.product.upsert({ where: { sku: p.sku }, update: data, create: { sku: p.sku, ...data } });
    before ? updated++ : created++;
  }

  const count = await prisma.product.count();
  console.log(`Done. ${created} created, ${updated} updated. ${count} products in the catalogue.`);
}

main()
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
